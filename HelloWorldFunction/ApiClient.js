const axios = require('axios');
const { transformToApiFormat } = require('./ApiUtils');

const API_ENDPOINT = process.env.API_ENDPOINT;
const API_ENDPOINT_KEY = process.env.API_ENDPOINT_KEY;
const API_BEARER_TOKEN = process.env.API_BEARER_TOKEN;
const WAIT_BETWEEN_API_CALLS_MS = Number(process.env.WAIT_BETWEEN_API_CALLS_MS) || 11000;

async function activateApiToken(context) {
  const activationUrl = `${API_ENDPOINT_KEY}/${API_BEARER_TOKEN}`;
  context.log(`Activating API token at: ${activationUrl}`);
  try {
    const response = await axios.get(activationUrl);
    if (response.status !== 200) {
      context.log(`Token activation failed: ${response.status} ${response.statusText} - ${response.data}`);
      throw new Error('Token activation failed');
    }
    context.log('API token activated successfully');
  } catch (error) {
    context.log(`Error during token activation: ${error}`);
    throw error;
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendReferral(context, apiBody) {
  context.log(`Sending referral for ${apiBody.nom} (ID: ${apiBody.id})`);
  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-api-key': API_BEARER_TOKEN
    };
    context.log(`Request URL: ${API_ENDPOINT}`);
    context.log(`X-api-key header: ${API_BEARER_TOKEN.substring(0, 10)}...`);
    context.log(`API payload: ${JSON.stringify(apiBody)}`);
    const response = await axios.post(API_ENDPOINT, apiBody, { headers });
    context.log(`Response status: ${response.status}`);
    if (response.status !== 200) {
      context.log(`API request failed for referral ${apiBody.id}: ${response.status} ${response.statusText} - ${response.data}`);
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
  context.log(`Successfully sent referral ${apiBody.id}`);
  await delay(WAIT_BETWEEN_API_CALLS_MS);
  return response;
  } catch (error) {
    context.log(`Error sending referral ${apiBody.id}: ${error}`);
    throw error;
  }
}

module.exports = {
  activateApiToken,
  sendReferral
};
