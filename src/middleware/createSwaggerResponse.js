const createSwaggerResponse = (responseData) => {
  const response = {
    type: "object",
    properties: {},
  };

  // Iterate over the keys and dynamically add them to the properties
  for (const [key, value] of Object.entries(responseData)) {
    if (typeof value === "string") {
      response.properties[key] = { type: "string", example: value };
    } else if (typeof value === "boolean") {
      response.properties[key] = { type: "boolean", example: value };
    } else if (typeof value === "number") {
      response.properties[key] = { type: "number", example: value };
    } else if (typeof value === "object" && !Array.isArray(value)) {
      response.properties[key] = {
        type: "object",
        properties: createResponse(value).properties,
      };
    } else if (Array.isArray(value)) {
      response.properties[key] = {
        type: "array",
        items: {
          type: typeof value[0] === "string" ? "string" : "object",
          example: value[0],
        },
      };
    }
  }

  return response;
};

module.exports = { createSwaggerResponse };
