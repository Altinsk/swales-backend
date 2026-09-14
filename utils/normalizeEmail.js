// Email is looked up by exact string match everywhere (Users.Email has a
// plain, case-sensitive unique constraint - not citext), but nothing
// trimmed or case-folded it before now. That let "John@Example.com" and
// "john@example.com" register as two different accounts, made a login
// attempt with different casing than registration fail with "User doesn't
// exist," and could silently create a duplicate account for a native user
// who Google-signs-in with a differently-cased email instead of linking to
// their existing one.
module.exports = function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : email;
};
