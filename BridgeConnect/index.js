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
      const activationUrl = `${process.env.API_URL}/ConnexionExterne/${process.env.API_BEARER_TOKEN}`;
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
          apiBody._sent = true; 
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
    let updatedRecords = [];
    for (const body of apiBodies) {
      if (body._sent) {
        updatedRecords.push({ id: body.id, name: body.nom, email: body.courriel });
      }
    }

    if (!error) {
      let html = `<h2>Records Updated</h2>`;
      if (updatedRecords.length > 0) {
        html += `<table border="1"><tr><th>ID</th><th>Name</th><th>Email</th></tr>`;
        for (const rec of updatedRecords) {
          html += `<tr><td>${rec.id}</td><td>${rec.name}</td><td>${rec.email}</td></tr>`;
        }
        html += `</table>`;
      } else {
        html += `<p>No records were updated.</p>`;
      }
      context.res = {
        status: 200,
        headers: { 'Content-Type': 'text/html' },
        body: html
      };
    } else {
      context.res = {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
        body: `<h2>Error</h2><pre>${error}</pre>`
      };
    }
  }
}
