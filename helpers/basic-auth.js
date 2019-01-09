const jwt = require('jsonwebtoken');
const userService = require('../users/user.service');
const secretKey = require('./credentials');

async function basicAuth(req, res, next) {
    // check for basic auth header
    if (!req.headers.authorization || req.headers.authorization.indexOf('Basic ') === -1) {
        return res.status(401).json({ message: 'Missing Authorization Header' });
    }

    // verify auth credentials
    const base64Credentials = req.headers.authorization.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [email, password] = credentials.split(':');
    console.log('client-supplied password:', password);
    const user = await userService.authenticate({ email, password }); // wait for db to tell whether credentials are authentic
    if (!user) {
        return res.status(401).json({ message: 'Invalid Authentication Credentials' });
    }

    // generate JWT using secretKey
    const now = new Date();
    const oneDayFromNow = now.setDate(now.getDate() + 1);
    const token = jwt.sign({ email, password, expirationDate: oneDayFromNow }, secretKey);

    // attach token to request object
    req.token = token;

    next();
}

module.exports = basicAuth;