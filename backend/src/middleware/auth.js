// backend/src/middleware/auth.js
module.exports.requireAuth = function requireAuth(req, res, next) {
  // This must match what you set in your login route
  if (!req.session || !req.session.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  // make current user available
  req.user = req.session.user;
  next();
};

module.exports.requireRole = function requireRole(roles = []) {
  const allowed = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    if (!allowed.includes(req.session.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    req.user = req.session.user;
    next();
  };
};
