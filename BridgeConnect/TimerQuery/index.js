require('dotenv').config();
const DbUtils = require('../DbUtils');

module.exports = async function (context, timer) {
  context.log('Timer trigger executed at:', new Date().toISOString());
  let client;
  try {
    const dbUrl = process.env.DB_CONNECTION;
    if (!dbUrl) throw new Error('DB_CONNECTION is not set.');
    const dbUtils = new DbUtils(dbUrl);
    const { activateApiToken, sendReferral } = require('../ApiClient');
    const { transformToApiFormat } = require('../ApiUtils');
    client = await dbUtils.connect();
    const results = await dbUtils.queryReferrals(client);
    context.log('Query results:', results);
    const apiBodies = results.map(transformToApiFormat);
    if (apiBodies.length === 0) {
      context.log('No unsent referrals found. No API calls made.');
    } else {
      await activateApiToken(context);
      for (const apiBody of apiBodies) {
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
    }
  } catch (err) {
    context.log('DB/API error:', err);
  } finally {
    if (client) await client.end();
  }
};
