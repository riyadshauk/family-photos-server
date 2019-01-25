const path = require('path');
const winston = require('winston');

/**
 * @note I'm currently going with `winston` for logging, under the hood.
 * This logger is wrapped by the logger (and errorLogger) in `./functions`, 
 * which the rest of the API exclusively uses for logging (or should, at least!).
 * Thus, I may easily swap out `winston` with `pino` or `bunyan`, or my own, simple logger, eg.
 */
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.json(),
    winston.format.timestamp(),
    winston.format.prettyPrint(),
  ),
  transports: [
    /**
     * - Write to all logs with level `info` and below to `../logs/combined.log` 
     * - Write all logs error (and below) to `../logs/error.log`.
     */
    new winston.transports.File({ filename: path.join(__dirname, '../logs/error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(__dirname, '../logs/combined.log') }),
  ]
});
module.exports = {
  logger,
}