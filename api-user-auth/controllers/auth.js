const crypto = require('crypto');
const io = require('../socket');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/User');

// @desc       Register user
// @route      POST /api/v1/auth/register
// @access     Public
exports.registerUser = asyncHandler(async (req, res, next) => {
    const { name, email, password, role } = req.body;

    // Create user
    const user = await User.create({
        name,
        email,
        password,
        role
    });

    const message = `Welcome to our system`
    try {
        // Uncomment to send an email
        // await sendEmail({
        //     email: user.email,
        //     subject: 'Welcome email',
        //     message: message
        // });
        io.getIO().emit('user', { action: 'registred', user: user.id });
        sendTokenResponse(user, 200, res);
    } catch (err) {
        console.log(err);
        return next(new ErrorResponse('Email cound not be sent', 500));
    }
});

// @desc       Login user
// @route      GET /api/v1/auth/login
// @access     Public
exports.loginUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Validate email and password
    if(!email || !password) {
        return next(new ErrorResponse('Please provide an email and password', 400));
    }

    // Find user by email
    const user = await User.findOne({email: email}).select('+password');
    if(!user) {
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    // Check if password matches
    const passwordMatch = await user.matchPassword(password);
    if(!passwordMatch) {
        return next(new ErrorResponse('Invalid credentials', 401));
    }

    io.getIO().emit('user', { action: 'connected', user: user.id });
    sendTokenResponse(user, 200, res);
});

// @desc       Get current logged in user
// @route      GET /api/v1/auth/profile
// @access     Private
exports.userProfile = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({success: true, data: user});
});

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJWT();
    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        httpOnly: true
    };

    if (process.env.NODE_ENV === 'production') {
        options.secure = true;
    }

    res.status(statusCode)
        .cookie('token', token, options)
        .json({success: true, token: token})
}
