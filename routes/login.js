const express = require('express');
const router = express.Router();
const basicAuth = require('../helpers/basic-auth');

router.post('/', basicAuth, (req, res) => { // uses basic auth to log in
  res.send(JSON.stringify({ token: req.token }));
});

module.exports = router;