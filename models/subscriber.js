"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Subscriber extends Model {}

  Subscriber.init(
    {
      SubscriberId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      Email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      SubscribedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: "Subscriber",
      tableName: "Subscribers",
      // SubscribedAt above already covers this - no separate
      // createdAt/updatedAt needed for a mailing-list row.
      timestamps: false,
    }
  );

  return Subscriber;
};
