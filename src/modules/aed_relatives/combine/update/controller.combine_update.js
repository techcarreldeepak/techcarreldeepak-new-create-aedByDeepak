const { update_combine_model } = require("./model.combine_update");

const updateCombineAedController = async (req, res, next) => {
  try {
    const result = await update_combine_model(req.body, req.params.id);
    console.log(result);
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
    console.error("Error occurred in updateAed", error);
  }
};

module.exports = {
  updateCombineAedController,
};
