const express = require('express');
const cors = require('cors');
const app = express();

const bodyParser = require('body-parser');

const { port, pathPrefix } = require('./helpers/constants');
const loginRouter = require('./routes/login');
const photosRouter = require('./routes/photos');
const uploadRouter = require('./routes/upload');
const setupErrorHandling = require('./helpers/functions').setupErrorHandling;

// global middlewares
app.use(cors()); // disable CORS (for local development)
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// api routes
app.use(`${pathPrefix}/login`, loginRouter);
app.use(`${pathPrefix}/photos`, photosRouter);
app.use(`${pathPrefix}/upload`, uploadRouter);

// This should be called last, just before app.listen, to catch and properly report any uncaught exceptions
setupErrorHandling();

// start server
const server = app.listen(port, () => {
  console.log('Server listening on port ' + port);
});

module.exports = server;

/**
 * @note For those considering self-hosting this web-server:
 *  Consider wrapping this server in self-signed CA with TSL assymetric encryption via 
 *  nginx config etc b/w browser/mobile and server (since basic auth is subject to MIM replay attacks)
 * @see https://letsencrypt.org (an free, open-source Certificate Authority)
 */