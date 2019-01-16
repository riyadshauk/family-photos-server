const jwt = require('jsonwebtoken');
const secretKey = require('./credentials');
const logger = require('../helpers/functions').logger;

/**
 * @todo Generalize this to be able to grant different levels of authorization (ie, different users may be allowed to access only certain routes) 
 * (eg: turn this into a factory?)
 * @todo look into user groups etc for different roles / research online
 * @param {*} decodedToken 
 */

const isValidCredentials = decodedToken => decodedToken.expirationDate > new Date();

const verifyAuthCredentials = (req, res, next, token) => {
  req.authenticated = false;
  logger('token from client:', token);
  try {
    const decodedToken = jwt.verify(token, secretKey);
    req.decodedToken = decodedToken;
    logger('decodedToken:', decodedToken);
    if (isValidCredentials(decodedToken)) {
      req.authenticated = true;
    } else {
      return res.status(401).json({ message: `Invalid bearer token provided! Your session may have expired and you may need to log in again to access this page.` });
    }
  } catch (err) {
    return res.status(401).json({ message: `Invalid bearer token provided.`, error: err.stack });
  }
  next();
};

const tokenAuth = (req, res, next) => {

  // ie: host/photos?token=a-valid-bearer-token
  if (req.query.token) {
    return verifyAuthCredentials(req, res, next, req.query.token);
  }

  // check for basic auth header
  if (!req.headers.authorization || req.headers.authorization.indexOf('Bearer ') === -1) {
    return res.status(401).json({ message: 'Missing Authorization Header' });
  }

  // at this point, token is provided in the 'Authorization' header, so we check that below
  const token = req.headers.authorization.split(' ')[1];
  verifyAuthCredentials(req, res, next, token);
}

module.exports = tokenAuth;