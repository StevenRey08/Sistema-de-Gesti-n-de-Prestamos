const LOG_LEVELS = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] || LOG_LEVELS.INFO;

function log(level, msg, meta) {
    if (level < currentLevel) return;
    const timestamp = new Date().toISOString();
    const entry = { timestamp, level: Object.keys(LOG_LEVELS)[level], message: msg };
    if (meta) entry.meta = meta;
    const output = JSON.stringify(entry);
    if (level >= LOG_LEVELS.ERROR) {
        console.error(output);
    } else {
        console.log(output);
    }
}

const logger = {
    debug: (msg, meta) => log(LOG_LEVELS.DEBUG, msg, meta),
    info: (msg, meta) => log(LOG_LEVELS.INFO, msg, meta),
    warn: (msg, meta) => log(LOG_LEVELS.WARN, msg, meta),
    error: (msg, meta) => log(LOG_LEVELS.ERROR, msg, meta),
};

module.exports = logger;
