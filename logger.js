const winston = require('winston')
const { createLogger, format, transports } = winston
const { combine, timestamp, label, printf } = format
const myFormat = printf(info => {
  return `${info.timestamp} ${info.level}: ${info.message}`
});
let transportsFiles = []
if (process.env.NODE_ENV !== 'testing' && process.env.NODE_ENV !== 'development') {
    transportsFiles = [
    new winston.transports.File({ filename: 'error.ws.log', level: 'error'}),
    new winston.transports.File({ filename: 'debug.ws.log', level: 'info'})
    ]
}

const logger = winston.createLogger({
  format: combine(
    timestamp(),
    myFormat
  ),
  transports: transportsFiles,
  exceptionHandlers: [
    new transports.File({ filename: 'exceptions.ws.log' })
  ]
});

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'testing') {
  logger.add(new winston.transports.Console({
    format: combine(
    timestamp(),
    myFormat
  )
  }))
}

module.exports = logger
