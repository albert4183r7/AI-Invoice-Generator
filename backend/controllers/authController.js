const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../logger');
const { setAuthCookie, clearAuthCookie } = require('../lib/authCookie');

// Helper: Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// The shape sent to the client. The password hash is select:false on the
// schema, but naming the fields explicitly means a future schema addition is
// not published by accident either.
const publicUser = (user) => ({
    _id: user._id,
    name: user.name,
    email: user.email,
    businessName: user.businessName || '',
    address: user.address || '',
    phone: user.phone || '',
});

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // create user
        const user = await User.create({ name, email, password });

        // The token is delivered as an httpOnly cookie, never in the body, so
        // no script on the page can read it back out.
        setAuthCookie(req, res, generateToken(user._id));

        res.status(201).json(publicUser(user));
    } catch (error) {
        logger.error({ err: error }, 'registration failed');
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Authenticate user & set session cookie
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.matchPassword(password))) {
            setAuthCookie(req, res, generateToken(user._id));
            res.json(publicUser(user));
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        logger.error({ err: error }, 'login failed');
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Clear the session cookie
// @route   POST /api/auth/logout
// @access  Public
exports.logoutUser = (req, res) => {
    // Deliberately unauthenticated: an expired or malformed token must still
    // be able to clear the cookie, otherwise the client is stuck holding it.
    clearAuthCookie(res);
    res.json({ message: 'Logged out' });
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    // protect() guarantees a real user document, so no null check is needed
    // here -- it already answers 401 before this handler runs.
    res.json(publicUser(req.user));
};

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
exports.updateUserProfile = async (req, res) => {
    try {
        // Re-read with the password hash included, so a password change can be
        // checked against the stored hash.
        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // `name` is required by the schema, so an empty one is rejected rather
        // than silently ignored.
        if (req.body.name !== undefined) {
            const name = String(req.body.name).trim();
            if (!name) {
                return res.status(400).json({ message: 'Name cannot be empty' });
            }
            user.name = name;
        }

        // The rest use `??`, not `||`. With `||` an empty string is falsy, so
        // clearing an address fell through to the stored value: the request
        // succeeded, the response returned the old text, and the UI refilled
        // the field the user had just emptied. `??` lets '' through so the
        // field can actually be cleared.
        user.businessName = req.body.businessName ?? user.businessName;
        user.address = req.body.address ?? user.address;
        user.phone = req.body.phone ?? user.phone;

        // Handle Password Change Logic
        if (req.body.password) {
            // matchPassword compares the incoming plaintext against the stored
            // hash, so this is really "is the new password the current one".
            const isSamePassword = await user.matchPassword(req.body.password);
            if (isSamePassword) {
                return res.status(400).json({ message: 'New password cannot be the same as the current password.' });
            }

            // The pre-save hook hashes it.
            user.password = req.body.password;
        }

        const updatedUser = await user.save();
        res.json(publicUser(updatedUser));
    } catch (error) {
        logger.error({ err: error }, 'profile update failed');
        res.status(500).json({ message: 'Server error' });
    }
};
