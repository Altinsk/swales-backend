"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Element extends Model {
    static associate(models) {
      // No associations yet — reference/catalog table, not user-owned data.
    }
  }

  Element.init(
    {
      ElementId: {
        type: DataTypes.STRING(100),
        primaryKey: true,
      },
      CommonName: { type: DataTypes.STRING(255), allowNull: false },
      ScientificName: { type: DataTypes.STRING(255), allowNull: true },
      Category: { type: DataTypes.STRING(50), allowNull: false },
      Subcategory: { type: DataTypes.STRING(100), allowNull: true },
      Layer: { type: DataTypes.STRING(50), allowNull: true },
      ClimateZone: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      HardinessZone: { type: DataTypes.STRING(100), allowNull: true },
      Functions: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      MatureHeightM: { type: DataTypes.FLOAT, allowNull: true },
      MatureSpreadM: { type: DataTypes.FLOAT, allowNull: true },
      SunRequirement: { type: DataTypes.STRING(50), allowNull: true },
      WaterRequirement: { type: DataTypes.STRING(50), allowNull: true },
      SoilPreference: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      PcZoneSuitability: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      GrowthRate: { type: DataTypes.STRING(50), allowNull: true },
      LifespanType: { type: DataTypes.STRING(50), allowNull: true },
      YieldType: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      HarvestSeason: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      GoodCompanions: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      AvoidNear: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        allowNull: false,
        defaultValue: [],
      },
      IconKey: { type: DataTypes.STRING(100), allowNull: true },
      Notes: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      modelName: "Element",
      tableName: "Elements",
      timestamps: false,
    }
  );

  return Element;
};
