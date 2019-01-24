const express = require('express');
const router = express.Router();

const tokenAuth = require('../helpers/token-auth');
const photosHelpers = require('../helpers/photos-helpers');
const photosMiddlewares = require('../helpers/photos-middlewares');
const parseLocalFilePath = require('../helpers/photos-helpers').parseLocalFilePath;

router.use(tokenAuth); // uses bearer token to secure sensitive / specified API routes

/**
 * Adds support for browser-side caching for each photo
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
  const localFilePath = parseLocalFilePath(req);
  if (localFilePath.includes('..')) { // harden filesystem access
    res.status(403).json({ message: 'Unauthorized: You may not attempt to navigate to arbitrary locations on the filesystem.' });
  }
  else if (req.query.q === 'listing') {
    photosMiddlewares.retrieveListing(req, res, localFilePath);
  } else if (req.query.q === 'exif') {
    photosMiddlewares.retrieveImageEXIFData(req, res, localFilePath);
  } else if (photosHelpers.isJpeg(localFilePath)) {
    photosMiddlewares.retrieveImage(req, res, localFilePath);
  } else if (photosHelpers.isVideo(localFilePath)) {
    photosMiddlewares.streamVideo(req, res, localFilePath);
  } else {
    res.status(403).json({ message: 'We only serve images, videos, and listings.' });
  }
});
module.exports = router;