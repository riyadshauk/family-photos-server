const fs = require('fs');
const path = require('path');
const errorLogger = require('./functions').errorLogger;
const logger = require('./functions').logger;
const photosHelpers = require('./photos-helpers');
const fsWrapper = require('./fs-wrapper');

const retrieveListing = async (req, res, localFilePath) => {
  const photosDir = path.join(__dirname, '../photos-root/', localFilePath);
  try {
    const listing = (await fsWrapper.readdir(photosDir)).reverse(); // list approximately more recent images (by name) first
    res.status(200).json({ listing });
  } catch (err) {
    errorLogger(err);
    res.status(404).json({ listing: [] }); // @todo make test for this scenario
  }
};
const retrieveImage = async (req, res, localFilePath) => {
  try {
    const image = await photosHelpers.getImage(localFilePath);
    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
    res.end(image);
  } catch (errorJSON) {
    res.status(404).json(errorJSON);
  }
};
const retrieveImageEXIFData = async (req, res, localFilePath) => {
  try {
    const image = await photosHelpers.getImage(localFilePath);
    const exifData = await photosHelpers.processImage(image);
    logger('exifData:', exifData);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(exifData));
  } catch (errorJSON) {
    errorLogger(errorJSON);
    res.status(404).json(errorJSON);
  }
};
const streamVideo = async (req, res, localFilePath) => {
  const joinedLocalFilePath = path.join(__dirname, '../photos-root/', localFilePath);
    const stats = await fsWrapper.stat(joinedLocalFilePath);
    const fileSize = stats.size;
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(joinedLocalFilePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': photosHelpers.getVideoMIMEType(joinedLocalFilePath),
      }
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': photosHelpers.getVideoMIMEType(joinedLocalFilePath),
      }
      res.writeHead(200, head);
      fs.createReadStream(joinedLocalFilePath).pipe(res);
    }
};
module.exports = {
  retrieveListing,
  retrieveImage,
  retrieveImageEXIFData,
  streamVideo
};