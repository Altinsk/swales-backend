"use strict";

// Baseline migration — see 20260823010000-create-users.js for context.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Shares", {
      uuid: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      ProjectData: { type: Sequelize.TEXT, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("Shares");
  },
};
