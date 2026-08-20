// models/share.js
"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Share extends Model {}

  Share.init(
    {
      uuid: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4, // Automatically generate a UUID
        primaryKey: true,
        allowNull: false,
      },
      ProjectData: {
        type: DataTypes.TEXT("long"),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Share",
      tableName: "Shares",
      // We only need createdAt, not updatedAt for a share link.
      // Sequelize adds createdAt by default if timestamps: true.
      timestamps: true,
      updatedAt: false,
    }
  );

  return Share;
};
