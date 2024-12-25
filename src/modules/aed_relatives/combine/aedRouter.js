const { Router } = require("express");
const { registerRoute } = require("../../../middleware/registerRoute");
const { createAedValidation } = require("./createAedValidation");
const { updateAedValidation } = require("./updateAedValidation");
const {
  createCombineAedController,
} = require("../combine/create/controller.combine_create");
const {
  getCombineAedController,
} = require("../combine/get/controller.combine_get");
const {
  updateCombineAedController,
} = require("../combine/update/controller.combine_update");
const { validateRequest } = require("../../../middleware/validateRequest");
const aedRouter = Router();

registerRoute(aedRouter, {
  method: "post",
  path: "/create_combine",
  schema: {
    body: createAedValidation,
  },
  middlewares: [validateRequest(createAedValidation)],
  handler: createCombineAedController,
  summary: "Submit a contact message",
  description: "This endpoint allows users to create a aed details.",
  tags: ["ROSS AED"],
});

registerRoute(aedRouter, {
  method: "get",
  path: "/get_combine",
  schema: {},
  middlewares: [],
  handler: getCombineAedController,
  summary: "Submit a contact message",
  description: "This endpoint allows users to get a aed details.",
  tags: ["ROSS AED"],
});

registerRoute(aedRouter, {
  method: "put",
  path: "/update_combine/:id",
  schema: { body: updateAedValidation },
  middlewares: [validateRequest(updateAedValidation)],
  handler: updateCombineAedController,
  summary: "Submit a contact message",
  description: "This endpoint allows users to update a aed details.",
  tags: ["ROSS AED"],
});

module.exports = aedRouter;
