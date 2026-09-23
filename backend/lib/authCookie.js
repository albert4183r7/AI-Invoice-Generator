// The session cookie is defined here rather than inside the controller so the
// middleware that reads it and the controller that writes it cannot drift
// apart on the cookie's name or flags.

const AUTH_COOKIE = 'token';

// 30 days, matching the expiry of the JWT itself. Keeping the two in step means
// the browser never holds a cookie whose token has already expired.
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const baseOptions = {
    httpOnly: true,  // unreachable from JavaScript, so an XSS payload cannot read it back
    sameSite: 'lax', // blocks cross-site POSTs while leaving normal navigation alone
    path: '/',
};

const setAuthCookie = (req, res, token) => {
    res.cookie(AUTH_COOKIE, token, {
        ...baseOptions,
        // Follow the actual connection rather than NODE_ENV. A TLS-terminated
        // deployment (req.secure honours the trust-proxy setting in server.js)
        // gets a Secure cookie; the plain-HTTP docker-compose stack would
        // otherwise have every login silently dropped, because a browser
        // refuses to store a Secure cookie delivered over HTTP.
        secure: req.secure,
        maxAge: TOKEN_TTL_MS,
    });
};

const clearAuthCookie = (res) => {
    // Browsers match on name and path, so the path flag has to be repeated
    // here or the logout would leave the original cookie in place.
    res.clearCookie(AUTH_COOKIE, baseOptions);
};

module.exports = { AUTH_COOKIE, setAuthCookie, clearAuthCookie };
