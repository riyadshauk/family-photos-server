const constants = require('./constants');
const functions = {};
functions.logger = (...args) => process.env.NODE_ENV !== 'production' && !constants.inProduction ? console.log(args) : undefined;
functions.errorLogger = (err) => process.env.NODE_ENV !== 'production' && !constants.inProduction ? console.error(err.stack) : undefined;
module.exports = functions;