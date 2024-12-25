const { typeSenseClient } = require("../config/typeSenseCon");
const sequelize = require("../config/database");

async function syncTypeSenseMiddleware(req, res, next) {
  const method = req.method;
  const modelName = req.query.model;
  const models = sequelize.models;
  const model = models[modelName];
  const docId = req.params.id;

  if (method === "POST") {
    const newDoc = await model.create(req.body);
    await typeSenseClient
      .collections(modelName)
      .documents()
      .create(newDoc.toJSON());
    console.log(`Added ${modelName} document to MySQL and Typesense`);
  } else if (method === "PUT") {
    await model.update(req.body, { where: { id: docId } });
    await typeSenseClient
      .collections(modelName)
      .documents(docId)
      .update(req.body);
    console.log(`Updated ${modelName} document in MySQL and Typesense`);
  } else if (method === "DELETE") {
    await model.destroy({ where: { id: docId } });
    await typeSenseClient.collections(modelName).documents(docId).delete();
    console.log(`Deleted ${modelName} document from MySQL and Typesense`);
  }

  next();
}

module.exports = {
  syncTypeSenseMiddleware,
};
