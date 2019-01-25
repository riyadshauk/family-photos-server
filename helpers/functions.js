const fs = require('fs');
const path = require('path');
const winston = require('winston');
const winstonLogger = require('./logger').logger;

const logger = (...args) => process.env.NODE_ENV !== 'production' ? winstonLogger.info(args.join('')) : undefined;
const errorLogger = (err) => winstonLogger.error(err ? err.stack || err : new Error().stack);
const setupErrorHandling = () => {

  // create logs directory, if not exists (synchronous is ok here, since it's one-time before server is listening)
  const logDir = path.join(__dirname, '../logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  // This should be last, before app.listen, to catch any uncaught exceptions that may otherwise crash the server
  process.on('uncaughtException', (err) => winstonLogger.error(`=== UNCAUGHT EXCEPTION:\n${err ? err.stack || err : new Error().stack}`));

  /**
   * If we're not in production then log to the `console` with the format:
   * `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
   */
  if (process.env.NODE_ENV !== 'production') {
    winstonLogger.add(new winston.transports.Console({
      format: winston.format.simple()
    }));
  }
}
module.exports = {
  logger,
  errorLogger,
  setupErrorHandling,
};