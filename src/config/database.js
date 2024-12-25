const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {

    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    logging: false, // set to console.log to see the raw SQL queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    logging: console.log,
  }
);


const sequelizeDb2 = new Sequelize(
  process.env.DB2_NAME,
  process.env.DB2_USER,
  process.env.DB2_PASS,
  {
    host: process.env.DB2_HOST,
    port: process.env.DB2_PORT,
    dialect: "mysql",
    logging: false, // Disable logging
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    logging: console.log,
  }
);

module.exports = {sequelize,sequelizeDb2};
