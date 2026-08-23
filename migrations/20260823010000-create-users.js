"use strict";

// Baseline migration — documents the schema as it already exists in every
// live database (created previously by sequelize.sync({ alter: true })).
// Not meant to be run against dev-branch/production: those get baselined by
// inserting this filename into SequelizeMeta directly. Safe to run as-is
// against a fresh/empty database (e.g. local dev, CI, a new Neon branch).
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Users", {
      UserId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      FirstName: { type: Sequelize.STRING(100), allowNull: false },
      LastName: { type: Sequelize.STRING(100), allowNull: false },
      Email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      PasswordHash: { type: Sequelize.TEXT, allowNull: true },
      PasswordSalt: { type: Sequelize.TEXT, allowNull: true },
      Verified: { type: Sequelize.BOOLEAN, defaultValue: false },
      dateOfBirth: { type: Sequelize.STRING(255), allowNull: true },
      DateCreated: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      DateLastUpdated: { type: Sequelize.DATE, allowNull: true },
      DateLastLogin: { type: Sequelize.DATE, allowNull: true },
      IsBlackListed: { type: Sequelize.BOOLEAN, defaultValue: false },
      IsDeleted: { type: Sequelize.BOOLEAN, defaultValue: false },
      loginType: { type: Sequelize.STRING(20), allowNull: true },
      AuthToken: { type: Sequelize.STRING(255), allowNull: true },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("Users");
  },
};
