const functions = {};
functions.logger = (...args) => process.env.NODE_ENV !== 'production' && !process.env.API_ROOT_URL ? console.log(args) : undefined;
functions.errorLogger = (err) => process.env.NODE_ENV !== 'production' && !process.env.API_ROOT_URL ? console.error(err.stack) : undefined;
module.exports = functions;