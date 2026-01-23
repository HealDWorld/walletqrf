const logger = require('../utils/logger');
const SecurityManager = require('../utils/security');

const requestLogger = (req, res, next) => {
    const start = Date.now();
    const ip = req.ip || req.connection.remoteAddress;
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.url}`, {
            ip,
            userAgent: req.get('User-Agent'),
            status: res.statusCode,
            duration: `${duration}ms`
        });
    });
    
    next();
};

const securityHeaders = (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
};

const botDetection = (req, res, next) => {
    const userAgent = req.get('User-Agent') || '';
    const botPatterns = [
        /bot/i, /crawler/i, /spider/i, /scraper/i,
        /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i
    ];
    
    const isBot = botPatterns.some(pattern => pattern.test(userAgent));
    
    if (isBot) {
        logger.warn('Bot detected', { userAgent, ip: req.ip });
        return res.status(403).json({ error: 'Access denied' });
    }
    
    next();
};

module.exports = {
    requestLogger,
    securityHeaders,
    botDetection
};