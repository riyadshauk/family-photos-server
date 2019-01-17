const fs = require('fs');
const path = require('path');
const express = require('express');
const exif = require('exif');
const router = express.Router();

const tokenAuth = require('../helpers/token-auth');
const errorLogger = require('../helpers/functions').errorLogger;
const logger = require('../helpers/functions').logger;
const asyncMiddleware = require('../helpers/async-middleware');
const FIFOCache = require('../helpers/data-structures').FIFOCache;

const imageCache = new FIFOCache(10);

const parseLocalFilePath = req => (req.params || {})[0] ? (req.params[0] || '').substring(1) : '';

const getImage = (localFilePath) => {
  return new Promise((resolve, reject) => {
    if (localFilePath.indexOf('.JPG') > -1 || localFilePath.indexOf('.jpg') > -1) {
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
}

router.use(tokenAuth); // uses bearer token to secure sensitive / specified API routes

/**
 * Add support for browser-side caching for each photo
 */
router.use((req, res, next) => {
  if (req.query.q === 'listing') return next(); // don't cache listing
  res.header('Cache-Control', 'max-age=2592000000'); // in ms, eg 30 days
  next();
});

/**
 * Queries specific files like /photos/a/b/c?q=listing to refer to grab all files in the subdirectory structure: a > b > c
 */
router.get('*', async (req, res) => {
  logger('photos router.get *: req.query:', req.query);
  logger('photos router.get *: req.params:', req.params);

  const localFilePath = parseLocalFilePath(req);
  logger('localFilePath:', localFilePath);

  if (req.query.q === 'listing') {
    const photosDir = path.join(__dirname, '../photos-root/', localFilePath);
    fs.readdir(photosDir, (err, listing) => {
      if (err) {
        errorLogger(err);
        res.status(404).json({ listing: [] }); // @todo make test for this scenario
      } else {
        res.status(200).json({ listing });
      }
    });
  } else if (req.query.q === 'exif') {
    try {
      const image = await getImage(localFilePath);
      const exifData = await processImage(image);
      logger('exifData:', exifData);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(exifData));
    } catch (errorJSON) {
      errorLogger(errorJSON);
      res.status(404).json(errorJSON);
    }
  } else {
    /**
     * @todo support more than just .jpg / .JPG filetypes
     */

    try {
      const image = await getImage(localFilePath);
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.end(image);
      // res.end({ image, orientation: getOrientationDegrees(exifData.image.Orientation) });
    } catch (errorJSON) {
      res.status(404).json(errorJSON);
    }

  }

});

module.exports = router;