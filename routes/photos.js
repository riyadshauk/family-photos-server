const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();
const tokenAuth = require('../helpers/token-auth');

const parseLocalFilePath = req => (req.params || {})[0] ? (req.params[0] || '').substring(1) : '';

const getImage = (localFilePath) => {
  if (localFilePath.indexOf('.JPG') > -1 || localFilePath.indexOf('.jpg') > -1) {
    return fs.readFileSync(path.join(__dirname, '../photos-root/', localFilePath));
  }
  throw { message: 'We currently only support requesting JPG / jpg files' };
};

router.use(tokenAuth); // uses bearer token to secure sensitive / specified API routes


/**
 * @todo query specific files like /photos/a/b/c?q=listing to refer to grab all files in the subdirectory structure: a > b > c
 */
router.get('*', (req, res) => {
  console.log('photos router.get *: req.query:', req.query);
  console.log('photos router.get *: req.params:', req.params);

  const localFilePath = parseLocalFilePath(req);
  console.log('localFilePath:', localFilePath);

  if (req.query.q === 'listing') {
    const photosDir = path.join(__dirname, '../photos-root/', localFilePath);
    const listing = fs.readdirSync(photosDir);
    return res.status(200).json({ listing });
  }

  /**
   * @todo support more than just .jpg / .JPG filetypes
   */
  try {
    const image = getImage(localFilePath);
    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
    res.end(image);
  } catch(errorJSON) {
    res.status(404).json(errorJSON);
  }

});

module.exports = router;