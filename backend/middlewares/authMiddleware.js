const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AUTH_COOKIE } = require('../lib/authCookie');

// The token travels in an httpOnly cookie, which is what the SPA uses. The
// Authorization header is still accepted so curl, scripts and integration
// tests can authenticate without maintaining a cookie jar.
const extractToken = (req) => {
    if (req.cookies && req.cookies[AUTH_COOKIE]) {
        return req.cookies[AUTH_COOKIE];
    }

    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
        return header.slice('Bearer '.length);
    }

    return null;
};

const protect = async (req, res, next) => {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }

    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }

    try {
        const user = await User.findById(decoded.id).select('-password');

        // A token can outlive the account it was issued for. Without this
        // check the request would continue with req.user === null, and every
        // downstream controller would dereference it into a 500.
        if (!user) {
            return res.status(401).json({ message: 'Not authorized, user no longer exists' });
        }

        req.user = user;
        return next();
    } catch (error) {
        // A well-formed token can still carry an id that is not a valid
        // ObjectId; findById throws on that rather than returning null.
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

module.exports = { protect };
