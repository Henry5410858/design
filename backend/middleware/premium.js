module.exports = (req, res, next) => {
  const plan = req.user?.plan;
  if (!plan || (plan !== 'Premium' && plan !== 'Ultra-Premium')) {
    return res.status(403).json({ message: 'Premium required' });
  }
  next();
};