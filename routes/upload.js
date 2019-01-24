const fs = require('fs');
const path = require('path');

const bodyParser = require('body-parser');
const express = require('express');
const multer  = require('multer');
const fileType = require('file-type');

const router = express.Router();

const tokenAuth = require('../helpers/token-auth');
const constants = require('../helpers/constants');
const logger = require('../helpers/functions').logger;
const errorLogger = require('../helpers/functions').errorLogger;
const fsWrapper = require('../helpers/fs-wrapper');

router.use(tokenAuth); // uses bearer token to secure sensitive / specified API routes

 /**
  * Limits total size of a file upload
  * @todo add test case for this
  */
const maxSize = 300 * Math.pow(2, 20)  // 300 MiB
const upload = multer({ dest: 'uploads/', limits: { fileSize: maxSize } });

const maxFileUploads = 10;

/**
 * For now, upload photos with a fixed max-upload size and a fixed quantity of uploads
 * (for security purposes since anybody could upload stuff in arbitrary ammounts)
 * Also, make sure that whatever is uploaded is actually a photo or video (and nothing else) -- look into
 * magic numbers / library for that
 * 
 * @todo test this upload functionality
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
  src.on('readable', async () => {
    let chunk;
    while (null !== (chunk = src.read(fileType.minimumBytes))) {
      logger(`Received ${chunk.length} bytes of data.`);
      const photoType = fileType(chunk);
      // src.destroy();
      logger('photoType:', photoType);
      if (photoType && !constants.allowedMIMETypes.has(photoType.mime)) {
        try {
          await fsWrapper.unlink(destFilePath);
          res.status(403).json({ message: '403 Unauthorized: Invalid filetype provided! Only images and videos may be uploaded. All traces of file upload have been removed from the filesystem.' });
        } catch (err) {
          errorLogger(err);
          res.status(500).json({ message: '500 – Invalid file type / Server Error.' }); // @todo test this case / when it happens
        }
      }
    }
  });
  src.on('end', () => {
    res.status(201).json({ message: `Photo (${req.query.fileName}) successfully uploaded & saved to back-end` });
  });
  src.on('error', (err) => {
    res.status(500).json({ message: '500 Server Error' });
  });
});
module.exports = router;