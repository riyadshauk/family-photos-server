const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const secretKey = require('./credentials');
const { numericUserPrivilege } = require('./constants');
const queryDB = require('./query-db');

class tokenAuthFactory {

  // assume req has following properties: token
  // assume token has following properties: email, password, issueDate, expirationDate, userGroup

  constructor(userGroup) {
    this.userGroup = userGroup;
  }

  async isValidCredentials(decodedToken) {
    let notBlacklisted;
    try {
      notBlacklisted = await !queryDB.isUserBlacklisted(decodedToken.email, decodedToken.issueDate);
    } catch (err) {
      // @todo
      notBlacklisted = false;
    }
    const notExpired = decodedToken.expirationDate > new Date();
    const privileged = numericUserPrivilege[decodedToken.userGroup] >= numericUserPrivilege[this.userGroup];
    console.log('privileged:', privileged);
    return notBlacklisted && notExpired && privileged;
  }

  async verifyAuthCredentials(req, res, next, token) {
    req.authenticated = false;
    try {
      const verify = promisify(jwt.verify);
      const decodedToken = await verify(token, secretKey);
      req.decodedToken = decodedToken;
      if (await this.isValidCredentials(decodedToken)) { // @todo uglify by adding try-catch here..?
        req.authenticated = true;
      } else {
        return res.status(401).json({ message: `Invalid bearer token provided! Your session may have expired or you are not in a user group as privileged as '${this.userGroup}' (your current user group is '${decodedToken.userGroup}').` });
      }
    } catch (err) {
      return res.status(401).json({ message: `Invalid bearer token provided.`, error: err.stack });
    }
    next();
  };

  tokenAuth(req, res, next) {

    // ie: host/photos?token=a-valid-bearer-token
    if (req.query.token) {
      return this.verifyAuthCredentials(req, res, next, req.query.token);
    }
  
    // check for basic auth header
    if (!req.headers.authorization || req.headers.authorization.indexOf('Bearer ') === -1) {
      return res.status(401).json({ message: 'Missing Authorization Header' });
    }
  
    // at this point, token is provided in the 'Authorization' header, so we check that below
    const token = req.headers.authorization.split(' ')[1];
    this.verifyAuthCredentials(req, res, next, token);
  }

};

module.exports = tokenAuthFactory;