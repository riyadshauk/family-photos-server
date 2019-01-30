const fs = require('fs');
const path = require('path');
const exif = require('exif');

const constants = require('../helpers/constants');
const { errorLogger } = require('../helpers/functions');
const { FIFOCache } = require('../helpers/data-structures');

const imageCache = new FIFOCache(10);

const parseLocalFilePath = req => (req.params || {})[0] ? (req.params[0] || '').substring(1) : '';
const getImage = (localFilePath) => {
  return new Promise((resolve, reject) => {
    if (isJpeg(localFilePath)) {
      const joinedImagePath = path.join(__dirname, '../photos-root/', localFilePath);
      const imageFromCache = imageCache.get(localFilePath);
      if (imageFromCache !== undefined) {
        resolve(imageFromCache);
      } else {
        fs.readFile(joinedImagePath, (err, image) => {
          if (err) {
            errorLogger(err);
            reject({ message: 'fs.readFile error:\n' + err.stack }); // @todo add test case for this (how/why this would ever occur)
          } else {
            imageCache.insert(localFilePath, image);
            resolve(image);
          }
        });
      }
    } else {
      reject({ message: 'We currently only support requesting JPG / jpg files' });
    }
  });
};
const processImage = (image) => {
  return new Promise((resolve, reject) => {
    exif.ExifImage({ image }, (err, data) => {
      if (err) {
        errorLogger(err);
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

/**
 * @returns orientation in degrees from the vertical (0), clockwise
 * @param {number} orientation 1 is correct orientation, 6 rotated 270 deg, 3 rotated 180 deg
 */
const getOrientationDegrees = (orientation) => {
  switch (orientation) {
    case 1:
      return 0;
    case 3:
      return 180;
    case 6:
      return 270;
    default:
      errorLogger('\n\nUNKNOWN ORIENTATION!\n\n');
  }
};
const fileContainsValidExtension = (filePath, validExtensions) => {
  for (let i = 0; i < validExtensions.length; i++) {
    if (filePath.indexOf(`.${validExtensions[i]}`) > -1 || filePath.indexOf(`.${validExtensions[i].toUpperCase()}`) > -1) {
      return true;
    }
  }
  return false;
};
const isJpeg = (filePath) => fileContainsValidExtension(filePath.substring(filePath.length - 5), ['jpg', 'jpeg']);
const isVideo = (filePath) => {
  const videoExtensions = Object.keys(constants.videoMIMEType);
  return fileContainsValidExtension(filePath.substring(filePath.length - 5), videoExtensions);
};
const getVideoMIMEType = (filePath) => {
  const ending = filePath.substring(filePath.length - 5);
  const videoMIMETypes = Object.keys(constants.videoMIMEType);
  for (let i = 0; i < videoMIMETypes.length; i++) {
    if (ending.includes(videoMIMETypes[i])) {
      return constants.videoMIMEType[videoMIMETypes[i]];
    }
  }
  return '';
};
module.exports = {
  parseLocalFilePath,
  getImage,
  processImage,
  getOrientationDegrees,
  fileContainsValidExtension,
  isJpeg,
  isVideo,
  getVideoMIMEType,
};