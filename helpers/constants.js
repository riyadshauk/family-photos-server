const constants = {};
constants.port = process.env.PORT || 8081;
constants.pathPrefix = process.env.NODE_ENV === 'production' || constants.inProduction ? '/photosapi' : ''; // in case we want to treat a specific path as the root (ie: riyadshauk.com/photos -> pathPrefix = '/photos')
constants.test = { // to the world: this is just for testing : P
  user: 'test',
  passwordHash: '78bbf9c8a9f5d4ae32365449d21c3830220a776f583fd923c1187e4bfcfe5d4c'
};
const VIDEO = 'video';
constants.videoMIMEType = {
  'flv':    `${VIDEO}/flv`,
  'mp4':    `${VIDEO}/mp4`,
  'm4v':    function() { return this.mp4 },
  'm3u8':   `application/x-mpegURL`,
  'ts':     `${VIDEO}/MP2T`,
  '3gp':    `${VIDEO}/3gpp`,
  'mov':    `${VIDEO}/quicktime`,
  'avi':    `${VIDEO}/x-msvideo`,
  'wmv':    `${VIDEO}/x-ms-wmv`,
};
constants.allowedMIMETypes = new Set([...Object.values(constants.videoMIMEType), 'image/jpeg']);
module.exports = constants;
