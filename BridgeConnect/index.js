require('dotenv').config();
const DbUtils = require('./DbUtils');
const { transformToApiFormat } = require('./ApiUtils');
const { activateApiToken, sendReferral } = require('./ApiClient');


module.exports.ActivateDBSweep = async function (context, req) {
  context.log('DB_CONNECTION:', process.env.DB_CONNECTION);
  context.log('Function started');
  let apiBodies = [];
  if (context.bindingData && context.bindingData.timer) {
    context.log('Timer trigger executed at:', new Date().toISOString());
  }
  let results = null;
  let error = null;
  try {
    context.log('Attempting to connect to DB...');
    const dbUrl = process.env.DB_CONNECTION;
    if (!dbUrl) {
      throw new Error('DB_CONNECTION is not set in Azure Application Settings or .env file.');
    }
    const dbUtils = new DbUtils(dbUrl);
    client = await dbUtils.connect();
    const results = await dbUtils.queryReferrals(client);
    apiBodies = results.map(transformToApiFormat);
    apiBodies.forEach((body, idx) => {
      context.log(`API body for record #${idx + 1}:`, JSON.stringify(body, null, 2));
    });

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

    await activateApiToken(context);
    for (let i = 0; i < apiBodies.length; i++) {
      const apiBody = apiBodies[i];
      try {
        const response = await sendReferral(context, apiBody);
        context.log(`API response for record ${apiBody.id}:`, response?.data ?? response);
        if (response?.status === 200 && response.data?.id) {
        await dbUtils.updateRecordAsSent(client, apiBody.id);
          context.log(`Record ${apiBody.id} marked as sent in DB.`);
        }
      } catch (err) {
        context.log(`Error sending referral for record ${apiBody.id}:`, err);
      }
    }
  } catch (err) {
    context.log('DB connection error:', err);
    error = err.message || String(err);
  }
      if (client) await client.end();

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
