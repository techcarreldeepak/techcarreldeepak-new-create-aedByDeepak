const { create_combine_model } = require("./model.combine_create");

const createCombineAedController = async (req, res, next) => {
  try {
    const result = await create_combine_model(req.body);
    if (result.success) {
      res.status(201).json({
        ...result,
      });
    } else {
      res.status(400).json({
        ...result,
      });
    }
  } catch (error) {
    next(error);
    console.error("Error occurred in createAedController", error);
  }
};

module.exports = {
  createCombineAedController,
};
