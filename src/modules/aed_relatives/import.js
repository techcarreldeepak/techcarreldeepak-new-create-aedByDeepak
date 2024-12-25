const {sequelize,sequelizeDb2} = require("../../config/database");

const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => next(err));
};

module.exports = {
  catchAsync,
  sequelize,
  sequelizeDb2
};
