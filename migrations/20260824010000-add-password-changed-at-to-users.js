"use strict";

// Supports session invalidation on password change: a JWT issued before
// PasswordChangedAt is rejected even though its signature/expiry still
// check out. Nullable — existing users have no recorded change date, so
// the check is simply skipped for them until their next password change.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Users", "PasswordChangedAt", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("Users", "PasswordChangedAt");
  },
};
