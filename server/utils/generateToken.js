const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecret_collab_fallback_key_2026', {
    expiresIn: '30d',
  });
};

module.exports = generateToken;