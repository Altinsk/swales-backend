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

// A JWT is stateless — its signature/expiry checking out doesn't mean the
// session should still be trusted. Called after the caller has already
// loaded the User row (so this adds no extra query): rejects a token
// issued before the user's last password change (stolen-token kill switch,
// since nothing else invalidates old tokens), and rejects any token for a
// blacklisted user (the IsBlackListed column existed but nothing checked it).
exports.assertSessionValid = (token, user) => {
  if (user.IsBlackListed) {
    throw new Error("Account access revoked");
  }
  if (user.PasswordChangedAt) {
    const { iat } = jwt.decode(token);
    if (iat * 1000 < new Date(user.PasswordChangedAt).getTime()) {
      throw new Error("Session invalidated by a more recent password change");
    }
  }
};
