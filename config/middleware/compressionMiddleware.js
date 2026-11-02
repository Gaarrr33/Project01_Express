const compression = require('compression');

const compressionMiddleware = compression({
    level: 9,
    threshold: 0,

    filter: (req, res) => {
        const contentType = res.getHeader('Content-Type');

        if (
            contentType &&
            contentType.includes('application/json')
        ) {
            return true;
        }

        return false;
    }
});

module.exports = compressionMiddleware;