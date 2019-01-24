const fs = require('fs');
const readdir = (joinedDirPath) => new Promise((resolve, reject) => fs.readdir(joinedDirPath, (err, dir) => err ? reject(err) : resolve(dir)));
const stat = (filePath) => new Promise((resolve, reject) => fs.stat(filePath, (err, stats) => err ? reject(err) : resolve(stats)));
const unlink = (filePath) => new Promise((resolve, reject) => fs.unlink(filePath, (err) => err ? reject(err) : resolve()));
const writeFile = (filePath, data) => new Promise((resolve, reject) => fs.writeFile(filePath, data, (err) => err ? reject(err) : resolve()));
module.exports = {
  readdir,
  stat,
  unlink,
  writeFile,
}