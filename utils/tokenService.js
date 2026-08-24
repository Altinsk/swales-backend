const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

exports.generateToken = async (email, firstName) => {
  return jwt.sign({ email, firstName }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};
exports.generateResetToken = async (email) => {
  return jwt.sign({ email }, process.env.RESET_SECRET, { expiresIn: "15m" });
};
exports.verifyToken = async (token) => {
  return jwt.verify(token, process.env.JWT_SECRET).email;
};
exports.verifyResetToken = async (token) => {
  return jwt.verify(token, process.env.RESET_SECRET).email;
};
