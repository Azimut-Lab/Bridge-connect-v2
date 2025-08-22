require('dotenv').config();
const DbUtils = require('../DbUtils');

module.exports = async function (context, timer) {
  context.log('Timer trigger executed at:', new Date().toISOString());
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
    context.log('Query results:', results);
  } catch (err) {
    context.log('DB connection error:', err);
    error = err.message || String(err);
  }
};
