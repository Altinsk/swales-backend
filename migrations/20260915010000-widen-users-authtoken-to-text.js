"use strict";

// Users.AuthToken (VARCHAR(255)) stores the raw Google id_token JWT on every
// Google sign-in (socialAuthController.js) - a real id_token's signature
// segment alone (256 bytes for a 2048-bit RSA key, base64url-encoded) is
// already ~342 characters before the header/payload, guaranteed to exceed
// 255 every time. Postgres enforces VARCHAR(n) strictly (no silent
// truncation), so every Google sign-in - first-time or returning - has been
// throwing a SequelizeDatabaseError ("value too long for type character
// varying(255)") and surfacing as a generic 500 "Google sign-in failed."
// Widened to TEXT (unbounded) since this column is write-only bookkeeping,
// never read back anywhere in the codebase - no reason to bound it at all.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("Users", "AuthToken", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn("Users", "AuthToken", {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },
};
