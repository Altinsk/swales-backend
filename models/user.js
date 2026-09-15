"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Define association here
      User.hasMany(models.Project, { foreignKey: "UserId" });
    }
  }

  User.init(
    {
      UserId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      FirstName: { type: DataTypes.STRING(100), allowNull: false },
      LastName: { type: DataTypes.STRING(100), allowNull: false },
      Email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      PasswordHash: { type: DataTypes.TEXT, allowNull: true },
      PasswordSalt: { type: DataTypes.TEXT, allowNull: true },
      Verified: { type: DataTypes.BOOLEAN, defaultValue: false },
      dateOfBirth: { type: DataTypes.STRING(255), allowNull: true },
      DateCreated: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      DateLastUpdated: { type: DataTypes.DATE, allowNull: true },
      DateLastLogin: { type: DataTypes.DATE, allowNull: true },
      IsBlackListed: { type: DataTypes.BOOLEAN, defaultValue: false },
      IsDeleted: { type: DataTypes.BOOLEAN, defaultValue: false },
      loginType: { type: DataTypes.STRING(20), allowNull: true },
      // Widened from STRING(255) to TEXT - a real Google id_token JWT
      // (~342+ characters minimum) always exceeded the old 255-char limit,
      // making every Google sign-in throw a DB error. Write-only bookkeeping,
      // never read back - no reason to bound its length at all.
      AuthToken: { type: DataTypes.TEXT, allowNull: true },
      PasswordChangedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "Users",
      timestamps: false,
    }
  );

  return User;
};
