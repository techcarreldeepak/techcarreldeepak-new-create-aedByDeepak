const TypeSense = require("typesense");
require("dotenv").config();


const typeSenseClient = new TypeSense.Client({
  nodes: [
    {
      host: "localhost",
      port: "8108",
      protocol: "http",
    },
  ],
  apiKey: process.env.TYPE_SENSE_API_KEY,
});

module.exports = {
  typeSenseClient,
};
