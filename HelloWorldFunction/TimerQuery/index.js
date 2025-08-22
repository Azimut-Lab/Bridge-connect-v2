require('dotenv').config();
const DbUtils = require('../DbUtils');

module.exports = async function (context, timer) {
  context.log('Timer trigger executed at:', new Date().toISOString());
  let error = null;
  try {
    context.log('Attempting to connect to DB...');
    let dbUrl = process.env.DB_CONNECTION;
    if (!dbUrl) {
      throw new Error('DB_CONNECTION is not set in Azure Application Settings or .env file.');
    }
    const dbUtils = new DbUtils(dbUrl);
    const { activateApiToken, sendReferral } = require('../ApiClient');
    const { transformToApiFormat } = require('../ApiUtils');

    // Query unsent referrals
    const results = await dbUtils.queryReferrals();
    context.log('Query results:', results);

    // Map DB results to API payloads
    const apiBodies = results.map(transformToApiFormat);

    // Authenticate with API
    await activateApiToken(context);

    // Send each referral and update DB if successful
    for (let i = 0; i < apiBodies.length; i++) {
      const apiBody = apiBodies[i];
      try {
        const response = await sendReferral(context, apiBody);
        context.log(`API response for record ${apiBody.id}:`, response ? response.data : response);
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
    context.log('DB/API error:', err);
    error = err.message || String(err);
  }
};
