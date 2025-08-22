const axios = require('axios');
const { transformToApiFormat } = require('./ApiUtils');

const API_ENDPOINT = process.env.API_ENDPOINT;
const API_ENDPOINT_KEY = process.env.API_ENDPOINT_KEY;
const API_BEARER_TOKEN = process.env.API_BEARER_TOKEN;
const WAIT_BETWEEN_API_CALLS_MS = Number(process.env.WAIT_BETWEEN_API_CALLS_MS) || 11000;

async function activateApiToken(context) {
  const activationUrl = `${API_ENDPOINT_KEY}/${API_BEARER_TOKEN}`;
  try {
    const response = await axios.get(activationUrl);
    if (response.status !== 200) throw new Error('Token activation failed');
    context.log('API token activated');
  } catch (error) {
    context.log(`Error during token activation: ${error}`);
    throw error;
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendReferral(context, apiBody) {
  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-api-key': API_BEARER_TOKEN
    };
    const response = await axios.post(API_ENDPOINT, apiBody, { headers });
    if (response.status !== 200) throw new Error(`API request failed: ${response.status} ${response.statusText}`);
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
