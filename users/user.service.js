const { Client } = require('pg');
const logger = require('../helpers/functions').logger;

module.exports = {
  authenticate,
};

async function authenticate({ email, password }) {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'photodb',
    password: 'postgres',
    port: 5432,
  });
  await client.connect();
  try {
    const res = await client.query('SELECT password FROM users WHERE email = $1::text', [email]);
    client.end();
    logger('res.rows:', res.rows);
    const row = res.rows[0] ? res.rows[0] : {};
    if (row.password === password) return email;
    else return false;
  } catch (err) {
    client.end();
    console.error('in BasicStrategy, client.query error: ', err, err.stack);
    return false;
  }
}