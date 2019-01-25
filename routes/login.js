const express = require('express');
const ExpressBrute = require('express-brute');
const router = express.Router();
const basicAuth = require('../helpers/basic-auth');

/**
 * @todo use database/disk store (not in-memory)
 */
// const	PgStore = require('express-brute-pg');
// const store = new PgStore({
//   username: 'postgres',
//   host: 'localhost',
//   database: 'photodb',
//   password: 'postgres',
// });

const store = new ExpressBrute.MemoryStore(); // stores state locally, don't use this in production
const bruteforce = new ExpressBrute(store, { freeRetries: 10 }); // need to have lots of retries so can successfully pass server tests

router.post('/', bruteforce.prevent, basicAuth, (req, res, next) => { // uses basic auth to log in
  res.send(JSON.stringify({ token: req.token }));
});

module.exports = router;