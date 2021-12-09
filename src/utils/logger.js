const { createLogger, format, transports } = require('winston')
const appRoot = require('app-root-path')


const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
    ),
    defaultMeta: { service: 'steamy-api' },
    transports: [
        new transports.File({ filename: `${appRoot}/logs/steamy-api-error.log`, level: 'error' }),
        new transports.File({ filename: `${appRoot}/logs/steampy-api-combined.log` })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        format: format.combine(
            format.colorize(),
            format.simple()
        )
    }));
}

module.exports = logger