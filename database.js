const { Sequelize } = require("sequelize");

// Connect to a local SQLite database file.
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "./database.sqlite",
  logging: false,
});

module.exports = sequelize;