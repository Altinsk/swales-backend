"use strict";

// Baseline migration — see 20260823010000-create-users.js for context.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Elements", {
      ElementId: {
        type: Sequelize.STRING(100),
        primaryKey: true,
      },
      CommonName: { type: Sequelize.STRING(255), allowNull: false },
      ScientificName: { type: Sequelize.STRING(255), allowNull: true },
      Category: { type: Sequelize.STRING(50), allowNull: false },
      Subcategory: { type: Sequelize.STRING(100), allowNull: true },
      ClimateZone: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
      },
      HardinessZone: { type: Sequelize.STRING(100), allowNull: true },
      Functions: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
      },
      MatureHeightM: { type: Sequelize.FLOAT, allowNull: true },
      MatureSpreadM: { type: Sequelize.FLOAT, allowNull: true },
      SunRequirement: { type: Sequelize.STRING(50), allowNull: true },
      WaterRequirement: { type: Sequelize.STRING(50), allowNull: true },
      SoilPreference: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
      },
      PcZoneSuitability: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
      },
      GrowthRate: { type: Sequelize.STRING(50), allowNull: true },
      LifespanType: { type: Sequelize.STRING(50), allowNull: true },
      YieldType: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
      },
      HarvestSeason: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
      },
      GoodCompanions: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
      },
      AvoidNear: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        defaultValue: [],
      },
      IconKey: { type: Sequelize.STRING(100), allowNull: true },
      Notes: { type: Sequelize.TEXT, allowNull: true },
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable("Elements");
  },
};
