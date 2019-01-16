const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();
const tokenAuth = require('../helpers/token-auth');
const errorLogger = require('../helpers/functions').errorLogger;
const logger = require('../helpers/functions').logger;

const parseLocalFilePath = req => (req.params || {})[0] ? (req.params[0] || '').substring(1) : '';

const getImage = (localFilePath) => {
  return new Promise((resolve, reject) => {
    if (localFilePath.indexOf('.JPG') > -1 || localFilePath.indexOf('.jpg') > -1) {
      fs.readFile(path.join(__dirname, '../photos-root/', localFilePath), (err, image) => {
        if (err) {
          errorLogger(err);
          reject({ message: 'fs.readFile error:\n' + err.stack }); // @todo add test case for this (how/why this would ever occur)
        } else {
          resolve(image);
        }
      });
    } else {
      reject({ message: 'We currently only support requesting JPG / jpg files' });
    }
  });
};

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
router.get('*', (req, res) => {
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
  } else {
    /**
     * @todo support more than just .jpg / .JPG filetypes
     */
    getImage(localFilePath)
    .then((image) => {
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.end(image);
    })
    .catch((errorJSON) => {
      res.status(404).json(errorJSON);
    });
  }

});

module.exports = router;