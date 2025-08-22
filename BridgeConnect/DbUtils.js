const { Client } = require('pg');

class DbUtils {
  constructor(connectionString) {
    if (!connectionString) throw new Error('DB connection string is required');
    this.connectionString = connectionString;
  }

  async connect() {
    const client = new Client({ connectionString: this.connectionString });
    await client.connect();
    return client;
  }

  async updateRecordAsSent(client, recordId) {
    await client.query('UPDATE referrals SET sent = true WHERE id = $1', [recordId]);
  }

  async queryReferrals(client) {
    const query = `
      SELECT id, your_name, your_email, referee_name, referee_email,
             referee_phone, additional_info, attachment_content,
             reference_type, company_name, number_of_employees,
             company_type, avantages_sociaux_services,
             cautionnement_services, financial_services,
             created_at, your_phone, attachment_name
      FROM referrals
      WHERE sent = false OR sent IS NULL
      ORDER BY id ASC
    `;
    const res = await client.query(query);
    return res.rows;
  }
}

module.exports = DbUtils;
