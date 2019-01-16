const constants = {};
constants.port = process.env.PORT || 8081;
constants.pathPrefix = '/photosapi'; // in case we want to treat a specific path as the root (ie: riyadshauk.com/photos -> pathPrefix = '/photos')
constants.test = { // to the world: this is just for testing : P
  user: 'test',
  passwordHash: '78bbf9c8a9f5d4ae32365449d21c3830220a776f583fd923c1187e4bfcfe5d4c'
}
module.exports = constants;
