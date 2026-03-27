const jwt = require("jsonwebtoken");

const jwtToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPRIES_IN
  });
};

module.exports = jwtToken;
