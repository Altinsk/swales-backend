// Same rule enforced client-side in both swales-services and swales-designer
// (signup, reset-password, change-password) — kept here too because the
// frontend check is trivially bypassed by calling these endpoints directly
// (curl/Postman, or a bug in any future client). Backend had no length or
// complexity check at all before this: register/resetPassword/changePassword
// would hash and store literally anything, including a 1-character password.
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s]).{8,}$/;

const PASSWORD_HINT =
  "Password must be 8+ characters, with uppercase, lowercase, a number, and a symbol.";

function isValidPassword(password) {
  return typeof password === "string" && PASSWORD_REGEX.test(password);
}

module.exports = { PASSWORD_REGEX, PASSWORD_HINT, isValidPassword };
