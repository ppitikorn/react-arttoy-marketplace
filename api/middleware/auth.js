const passport = require('passport');

const authenticateJWT = passport.authenticate('jwt', { session: false });

const authenticateGoogle = passport.authenticate('google', {
  scope: ['profile', 'email']
});
// เขียน middleware แบบ optional: ถ้ามี token ก็ใช้ user, ถ้าไม่มีก็เป็น anonymous
const optionalAuth = (req, res, next) => {
  if (req.user) {
    // ถ้ามี user ใน request ก็ใช้ user นั้น
    req.user = req.user;
  } else {
    // ถ้าไม่มี user ก็สร้าง anonymous user
    req.user = {
      _id: null,
      email: null,
      name: 'Anonymous',
      role: 'guest'
    };
  }
  next();
};

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
  optionalAuth,
  isAdmin
};