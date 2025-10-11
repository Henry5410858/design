const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Malformed token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

    // Attach decoded payload to request
    req.user = {
      id: decoded.id,
      userId: decoded.id, // Add userId for compatibility
      username: decoded.username,
      plan: decoded.plan || 'Gratis', // default plan if missing
      role: decoded.role || 'user',
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
