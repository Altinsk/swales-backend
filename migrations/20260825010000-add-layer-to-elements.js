"use strict";

// Adds the derived food-forest `layer` field to Elements — see
// seed-data/schema.md's "Why this shape" section for the derivation rules.
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Elements", "Layer", {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn("Elements", "Layer");
  },
};
