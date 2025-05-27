const passport = require('passport');

const authenticateJWT = passport.authenticate('jwt', { session: false });

const authenticateGoogle = passport.authenticate('google', {
  scope: ['profile', 'email']
});

const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
};

module.exports = {
  authenticateJWT,
  authenticateGoogle,
  isAdmin
};