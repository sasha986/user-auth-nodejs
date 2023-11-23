const express = require('express');
const {
    registerUser,
    loginUser,
    logoutUser,
    userProfile,
} = require('../controllers/auth');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, userProfile);

module.exports = router;
