"use strict";

// Baseline migration — see 20260823010000-create-users.js for context.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Projects", {
      ProjectId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      UserId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "Users", key: "UserId" },
        onUpdate: "CASCADE",
        onDelete: "NO ACTION",
      },
      Name: { type: Sequelize.STRING(255), allowNull: false },
      ThumbnailUrl: { type: Sequelize.STRING, allowNull: true },
      ProjectData: { type: Sequelize.TEXT, allowNull: false },
      DateCreated: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      DateLastUpdated: { type: Sequelize.DATE, allowNull: true },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("Projects");
  },
};
