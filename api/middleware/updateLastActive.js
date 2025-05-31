//Update last active timestamp middleware
const User = require('../models/User');
const updateLastActive = async (req, res, next) => {
  try {
    const userId = req.user._id; // Assuming user ID is stored in req.user
    const currentTime = new Date();

    // Update last active timestamp
    await User.findByIdAndUpdate(userId, { lastActive: currentTime }, { new: true });

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error('Error updating last active timestamp:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = updateLastActive;
