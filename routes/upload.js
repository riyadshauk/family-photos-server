const fs = require('fs');
const path = require('path');

const express = require('express');
const multer  = require('multer');
const fileType = require('file-type');

const router = express.Router();

const tokenAuthFactory = require('../helpers/token-auth-factory');
const constants = require('../helpers/constants');
const { errorLogger } = require('../helpers/functions');
const fsWrapper = require('../helpers/fs-wrapper');

const factory = new tokenAuthFactory('public');
const tokenAuth = factory.tokenAuth.bind(factory);
router.use(tokenAuth); // uses bearer token to secure sensitive / specified API routes

/**
 * Limits total size of a file upload
 * @todo add test case for this
 */
const maxSize = 300 * Math.pow(2, 20);  // 300 MiB
/**
 * @property dest is a location where the upload will incrementally stream to, in chunks 
 * (but we may rename and save the file elsewhere, upon successful upload of valid file).
 */
const upload = multer({ dest: 'uploads/', limits: { fileSize: maxSize } });

const maxFileUploads = 10;

/**
 * For now, upload photos with a fixed max-upload size and a fixed quantity of uploads
 * (for security purposes since anybody could upload stuff in arbitrary ammounts)
 * Also, make sure that whatever is uploaded is actually a photo or video (and nothing else) -- look into
 * magic numbers / library for that
 * 
 * @todo test this upload functionality
 * @todo look into using an open source antivirus scanner or something to that extent (to check portions of the file past the initial bytes)
 * 
 * @see https://github.com/expressjs/multer
 */
router.post('/', upload.single('photo'), async (req, res) => {
  const photosDir = path.join(__dirname, '../photos-root/demo');

  try {
    const files = await fsWrapper.readdir('uploads/');
    if (files.length > maxFileUploads) {
      return res.status(403).json({ message: `403 Unauthorized: Only a maximum of ${maxFileUploads} files may be uploaded to this web server at this time.` });
    }
  } catch (err) {
    errorLogger(err);
    return res.status(403).json({ message: '500 Server Error' });
  }

  // req.file is the `photo` file (assuming form name === photo on client-side)

  const src = fs.createReadStream(req.file.path);
  const destFilePath = path.join(photosDir, req.query.fileName);
  const dst = fs.createWriteStream(destFilePath);
  src.pipe(dst);
  src.on('readable', () => {
    let chunk;
    while (null !== (chunk = src.read(fileType.minimumBytes))) {
      const photoType = fileType(chunk);
      if (photoType && !constants.allowedMIMETypes.has(photoType.mime)) {
        /**
         * @note This is important (src.destroy), otherwise the stream doesn't close and may lead to an error being thrown
         * The throwable would trigger due to Express, ie: 
         * `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client`
         * (since the 'end' event is fired after 'readable', resulting in an attempt to send two client responses)
         * @param error - any truthy value will cause only the 'error' event to emit, o.w. 'close' event emits
         * @see https://github.com/nodejs/node/blob/master/lib/_stream_readable.js
         * and @see https://github.com/nodejs/node/blob/master/lib/internal/streams/destroy.js
         */
        src.destroy(true);
        try {
          res.status(403).json({ message: '403 Unauthorized: Invalid filetype provided! Only images and videos may be uploaded. The file has not been uploaded.' });
        } catch (err) {
          errorLogger(err);
          res.status(500).json({ message: '500 – Invalid file type / Server Error.' }); // @todo test this case / when it happens
        }        
      }
    }
  });

  /**
   * @note While hardening security and adding user priveleges, do not yet remove the files that get uploaded
   */
  src.on('end', () => {
    // fsWrapper.unlink(req.file.path);  // remove superfluous copy of file from upload directory
    res.status(201).json({ message: `Photo (${req.query.fileName}) successfully uploaded & saved to back-end` });
  });
  src.on('error', (err) => {
    /**
     * @note At this point, we have closed the stream (via src.destroy).
     * So we do the following two steps:
     * • We remove the partially downloaded file from the destination folder 
     * (the destination file cannot be removed while the stream is still open).
     * • We remove the partially downloaded file from the uploads directory 
     * (removing it above would implicitly send a response back to the client).
     */
    fsWrapper.unlink(destFilePath);   // remove partial file in destination directory
    fsWrapper.unlink(req.file.path);  // remove partial file in upload directory
  });
});
module.exports = router;