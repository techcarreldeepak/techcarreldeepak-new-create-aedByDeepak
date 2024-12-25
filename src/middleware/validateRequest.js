// validateRequest.js (middleware)
const validateRequest = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    next(error);
    return res
      .status(400)
      .json({ success: false, error: error.details[0].message });
  }
  next();
};

module.exports = { validateRequest };