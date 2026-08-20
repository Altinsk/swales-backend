"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Project extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define association here
      Project.belongsTo(models.User, { foreignKey: "UserId" });
    }
  }

  Project.init(
    {
      ProjectId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users", // Reference the table name
          key: "UserId",
        },
      },
      Name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      ThumbnailUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ProjectData: {
        type: DataTypes.TEXT("long"),
        allowNull: false,
      },
      DateCreated: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      DateLastUpdated: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Project",
      tableName: "Projects",
      timestamps: false,
    }
  );

  return Project;
};
