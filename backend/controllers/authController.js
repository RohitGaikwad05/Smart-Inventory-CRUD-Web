const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify environment variables
if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined.');
  process.exit(1);
}

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Simple validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }

    // Check for user
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    // Create user
    const user = await User.create({ name, email, password });

    res.status(201).json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || 'Server Error during registration'
    });
  }
};


// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // --- EMERGENCY DEMO BYPASS ---
    // If the DB is blocked, you can still log in with these credentials for your demo.
    if (email === 'admin@smartinventory.app' && password === 'admin123') {
      return res.json({
        token: generateToken('demo-admin-id'),
        user: { id: 'demo-admin-id', name: 'Demo Administrator', email: 'admin@smartinventory.app', role: 'admin' }
      });
    }

    // Check for user (with a fast timeout to prevent the 10s hang)
    let user;
    try {
      user = await User.findOne({ email }).select('+password').maxTimeMS(2000);
    } catch (err) {
      return res.status(500).json({ message: 'Database Connection Error. Please use the Demo Credentials for the presentation.' });
    }

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }


    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Server Error during login'
    });
  }
};


// @desc    Get current logged in user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile'
    });
  }
};

// @desc    Google Login/Sign-up
// @route   POST /api/auth/google
exports.googleLogin = async (req, res) => {
  try {
    console.log('Google Login Request:', req.body);
    const { email, name, googleId } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required from Google'
      });
    }

    let user = await User.findOne({ email });

    if (!user) {
      // If a password was provided during the interactive Google signup, use it.
      // Otherwise, generate a secure random one as a fallback.
      const finalPassword = req.body.password || (Math.random().toString(36).slice(-10) + 'X9!');

      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: finalPassword
      });
    }


    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Google Login Error:', error);
    res.status(500).json({
      message: error.message || 'Google authentication failed'
    });
  }
};



