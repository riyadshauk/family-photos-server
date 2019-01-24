const express = require('express');
const cors = require('cors');
const app = express();

const { port, pathPrefix } = require('./helpers/constants');

const bodyParser = require('body-parser');
const errorHandler = require('./helpers/error-handler');

const loginRouter = require('./routes/login');
const photosRouter = require('./routes/photos');
const uploadRouter = require('./routes/upload');

// global middlewares
app.use(cors()); // disable CORS (for local development)
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(errorHandler);

// api routes
app.use(`${pathPrefix}/login`, loginRouter);
app.use(`${pathPrefix}/photos`, photosRouter);
app.use(`${pathPrefix}/upload`, uploadRouter);

// start server
const server = app.listen(port, () => {
  console.log('Server listening on port ' + port);
});

module.exports = server;

/**
 * @todo wrap server in self-signed CA with TSL assymetric encryption via nginx config etc
 *  b/w browser/mobile and server (since basic auth is subject to MIM replay attacks)
 */