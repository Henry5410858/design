// Premium access middleware with dev bypass via env flag
const allowBypass = process.env.ALLOW_PDF_NON_PREMIUM === 'true' || process.env.NODE_ENV !== 'production';

module.exports = (req, res, next) => {
  if (allowBypass) {
    return next();
  }

  const plan = req.user?.plan;
  if (!plan || (plan !== 'Premium' && plan !== 'Ultra-Premium')) {
    return res.status(403).json({ message: 'Premium required' });
  }
  next();
};