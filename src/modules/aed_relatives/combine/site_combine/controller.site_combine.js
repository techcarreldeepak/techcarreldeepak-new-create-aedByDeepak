const { get_site_combine_model } = require("./model.site_combine");

const getSiteCombineAedController = async (req, res, next) => {
  try {
    const { account_id, page, pageSize,search } = req.query;
    const result = await get_site_combine_model(
      account_id,
      page,
      pageSize,
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
  getSiteCombineAedController,
};
