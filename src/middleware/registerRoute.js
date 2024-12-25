const convert = require("joi-to-swagger");

const routes = [];

const registerRoute = (
  router,
  {
    method,
    path,
    schema = {},
    handler,
    middlewares = [],
    summary,
    description,
    tags = [],
    responses = {},
  }
) => {
  router[method](path, ...middlewares, handler);

  const parameters = [];
  const requestBody = {};

  // Handling path parameters
  if (schema.params) {
    const { swagger: paramsSwagger } = convert(schema.params);
    parameters.push(
      ...Object.keys(paramsSwagger.properties).map((key) => ({
        name: key,
        in: "path",
        required: schema.params._flags.presence === "required",
        schema: paramsSwagger.properties[key],
        description:
          paramsSwagger.properties[key].description ||
          "No description provided",
      }))
    );
  }

  // Handling query parameters
  if (schema.query) {
    const { swagger: querySwagger } = convert(schema.query);
    parameters.push(
      ...Object.keys(querySwagger.properties).map((key) => ({
        name: key,
        in: "query",
        required: schema.query._flags.presence === "required",
        schema: querySwagger.properties[key],
        description:
          querySwagger.properties[key].description || "No description provided",
      }))
    );
  }

  // Handling body schema (request payload)
  if (schema.body) {
    const { swagger: bodySwagger } = convert(schema.body);
    requestBody.content = {
      "application/json": {
        schema: bodySwagger,
      },
    };
  }

  // Add responses (either passed or empty if not defined)
  const responseSchemas = {};
  Object.keys(responses).forEach((statusCode) => {
    responseSchemas[statusCode] = {
      description:
        responses[statusCode].description || "No description provided",
      content: {
        "application/json": {
          schema: responses[statusCode].schema || {},
        },
      },
    };
  });

  // Store the route details in the routes array
  routes.push({
    path,
    method,
    summary,
    description,
    tags,
    parameters,
    requestBody,
    responses: responseSchemas, // Add the responses to the route
  });
};

module.exports = { registerRoute, routes };
