require('dotenv').config();
const DbUtils = require('./DbUtils');
const { transformToApiFormat } = require('./ApiUtils');
const { activateApiToken, sendReferral } = require('./ApiClient');


module.exports = async function (context, req) {
  context.log('DB_CONNECTION:', process.env.DB_CONNECTION);
  context.log('Function started');
  let apiBodies = [];
  // Detect timer trigger
  if (context.bindingData && context.bindingData.timer) {
    context.log('Timer trigger executed at:', new Date().toISOString());
  }
  let results = null;
  let error = null;
  try {
    context.log('Attempting to connect to DB...');
    let dbUrl = process.env.DB_CONNECTION;
    if (!dbUrl) {
      throw new Error('DB_CONNECTION is not set in Azure Application Settings or .env file.');
    }
    const dbUtils = new DbUtils(dbUrl);
    results = await dbUtils.queryReferrals();
    // Transform each record to API body
    apiBodies = results ? results.map(record => transformToApiFormat(record)) : [];
    // Log each API body
    apiBodies.forEach((body, idx) => {
      context.log(`API body for record #${idx + 1}:`, JSON.stringify(body, null, 2));
    });

      // Make GET request to activate token and print response using axios
      const axios = require('axios');
      const activationUrl = `${process.env.API_ENDPOINT_KEY}/${process.env.API_BEARER_TOKEN}`;
      let activationResponse = null;
      try {
        const response = await axios.get(activationUrl);
        activationResponse = {
          status: response.status,
          statusText: response.statusText,
          body: response.data
        };
        context.log('Activation API response:', activationResponse);
      } catch (err) {
        activationResponse = { error: String(err) };
        context.log('Activation API error:', err);
      }

    // Activate token once before sending referrals
    await activateApiToken(context);
    // Send each referral and log response
    for (let i = 0; i < apiBodies.length; i++) {
      const apiBody = apiBodies[i];
      try {
        const response = await sendReferral(context, apiBody);
  context.log(`API response for record ${apiBody.id}:`, response ? response.data : response);
        // If response is OK, update DB column 'sent' to true using returned id
        if (response && response.status === 200 && response.data && response.data.id) {
          try {
            await dbUtils.updateRecordAsSent(apiBody.id);
            context.log(`Record ${apiBody.id} marked as sent in DB.`);
          } catch (dbErr) {
            context.log(`Error updating DB for record ${apiBody.id}:`, dbErr);
          }
        }
      } catch (err) {
        context.log(`Error sending referral for record ${apiBody.id}:`, err);
      }
    }
  } catch (err) {
    context.log('DB connection error:', err);
    error = err.message || String(err);
  }

  // If HTTP trigger, respond with results
  if (req) {
    context.res = {
      status: error ? 500 : 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        message: "Hello, World!",
        error,
        results,
        apiBodies,
        activationResponse
      }
    };
  }
}
