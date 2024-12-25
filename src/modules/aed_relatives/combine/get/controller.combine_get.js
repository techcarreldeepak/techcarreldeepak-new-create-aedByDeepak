const { get_combine_model } = require("./model.combine_get");

const getCombineAedController = async (req, res, next) => {
  try {
    const { aed_id, page, pageSize, is_listing, search } = req.query;
    const result = await get_combine_model(
      aed_id,
      page,
      pageSize,
      is_listing,
      search
    );
    if (result.success) {
      res.status(200).json({
        ...result,
      });
    } else {
      res.status(400).json({
        ...result,
      });
    }
  } catch (error) {
    next(error);
    console.error("Error occurred in getAed", error);
  }
};

module.exports = {
  getCombineAedController,
};
