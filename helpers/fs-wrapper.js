const fs = require('fs');
const { promisify } = require('util');
module.exports = {
  readdir: promisify(fs.readdir),
  stat: promisify(fs.stat),
  unlink: promisify(fs.unlink),
  writeFile: promisify(fs.writeFile),
}