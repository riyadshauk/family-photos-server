const { Client } = require('pg');
const { errorLogger } = require('./functions');
const { clientCredentials } = require('./constants');

const getUserGroup = async (email) => {
  const client = new Client(clientCredentials);
  await client.connect();
  return new Promise(async (resolve, reject) => {
    try {
      const res = await client.query(`
        SELECT privilege
        FROM groups
        INNER JOIN usergroup
        ON groups.group_id = usergroup.group_id
        INNER JOIN users
        ON users.email = $1::text;
      `, [email]);
      client.end();
      const row = res.rows[0] ? res.rows[0] : {};
      resolve(row.privilege);
    } catch (err) {
      client.end();
      errorLogger(err);
      resolve('public');   // silently provide back lowest privileged group
    }
  });
};

const blackListUser = async (email) => {
  const client = new Client(clientCredentials);
  await client.connect();
  return new Promise(async (resolve, reject) => {
    try {
      const res = await client.query(`
        INSERT INTO blacklist (user_id, date)
        SELECT user_id, to_timestamp(${Date.now()} / 1000.0)
        FROM users
        WHERE users.email = $1::text;
      `, [email]);
      client.end();
      const row = res.rows[0] ? res.rows[0] : {};
      resolve(row);
    } catch (err) {
      client.end();
      errorLogger(err);
      reject(err);
    }
  });
};

const isUserBlacklisted = async (email, tokenIssueDateString) => {
  const client = new Client(clientCredentials);
  await client.connect();
  return new Promise(async (resolve, reject) => {
    try {
      const res = await client.query(`
        SELECT date
        FROM blacklist
        INNER JOIN users
        ON blacklist.user_id = users.user_id
        INNER JOIN users u1
        ON u1.email = $1::text;
      `, [email]);
      client.end();
      const row = res.rows[0] ? res.rows[0] : {};
      const isBlackListed = new Date(tokenIssueDateString) < new Date(row.date);
      resolve(isBlackListed);
    } catch (err) {
      client.end();
      errorLogger(err);
      reject(err);    // @todo figure out better error handling here...
    }
  });
};

module.exports = {
  blackListUser,
  getUserGroup,
  isUserBlacklisted,
};