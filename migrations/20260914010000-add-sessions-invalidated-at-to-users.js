"use strict";

// Same mechanism as PasswordChangedAt (20260824010000), for a different
// trigger: logout previously only cleared the client's cookie - a token
// extracted before logout (copied cookie value, compromised machine, a
// synced/backed-up cookie jar) stayed valid for the rest of its 30-day
// life even after the user believed they'd logged out. Bumping this column
// on logout and rejecting any token with an `iat` older than it (see
// assertSessionValid in utils/tokenService.js) closes that gap. Nullable -
// existing users have never explicitly logged out under this mechanism, so
// the check is simply skipped for them until their next logout.
//
// Note: this invalidates ALL of that user's outstanding tokens, not just
// the one being logged out - there's no per-session/per-device tracking in
// this schema, so "log out this device" and "log out everywhere" are the
// same operation for now.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Users", "SessionsInvalidatedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("Users", "SessionsInvalidatedAt");
  },
};
