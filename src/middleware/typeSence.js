const { typeSenseClient } = require("../config/typeSenseCon");
const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

function mapSequelizeTypeToTypeSense(type) {
  if (type instanceof DataTypes.STRING) {
    return "string";
  } else if (type instanceof DataTypes.TEXT) {
    return "string";
  } else if (type instanceof DataTypes.INTEGER) {
    return "int32"; // Use "int32" for integer types in Typesense
  } else if (type instanceof DataTypes.FLOAT || type instanceof DataTypes.DOUBLE) {
    return "float"; // Use "float" for float and double types
  } else if (type instanceof DataTypes.DECIMAL) {
    return "float"; // Treat decimal as float
  } else if (type instanceof DataTypes.BOOLEAN) {
    return "bool"; // Use "bool" for boolean types
  } else if (type instanceof DataTypes.DATE) {
    return "string"; // Use string for date
  } else if (type instanceof DataTypes.DATEONLY) {
    return "string"; // Use string for date-only
  } else if (type instanceof DataTypes.TIME) {
    return "string"; // Use string for time
  } else if (type instanceof DataTypes.JSON || type instanceof DataTypes.JSONB) {
    return "object"; // Use "object" for JSON types
  } else if (type instanceof DataTypes.UUID) {
    return "string"; // Use string for UUIDs
  } else if (type instanceof DataTypes.ENUM) {
    return "string"; // Use string for enum types
  } else if (type instanceof DataTypes.BIGINT) {
    return "int32"; // Use "int32" for bigint types
  } else if (type instanceof DataTypes.SMALLINT) {
    return "int32"; // Use "int32" for smallint types
  } else if (type instanceof DataTypes.TINYINT) {
    return "int32"; // Use "int32" for tinyint types
  }

  // Fallback type
  return "string"; // Default to string if type is not recognized
}

async function generateTypeSenseSchemas() {
  const models = sequelize.models;

  for (const modelName in models) {
    const model = models[modelName];
    console.log(model);

    const typeSenseSchema = {
      name: modelName, // Name of the collection
      fields: Object.keys(model.rawAttributes).map((field) => {
        const fieldType = model.rawAttributes[field].type;
        return {
          name: field,
          type: mapSequelizeTypeToTypeSense(fieldType),
          optional: model.rawAttributes[field].allowNull // Specify if the field can be null
        };
      }),
    };

    // Delete the old Typesense collection if it exists
    try {
      await typeSenseClient.collections(modelName).delete();
      console.log(`Deleted old Typesense collection for ${modelName}`);
    } catch (err) {
      if (err.message.includes("not found")) {
        console.log(`${modelName} collection not found in Typesense, creating a new one.`);
      } else {
        console.error(`Error deleting collection ${modelName}:`, err);
      }
    }

    // Create a new Typesense collection
    await typeSenseClient.collections().create(typeSenseSchema);
    console.log(`Created new Typesense schema for ${modelName}`);

    // Sync the data from MySQL to Typesense
    const records = await model.findAll();
    const recordsArray = records.map((record) => {
      const recordJSON = record.toJSON();
      // Remove any fields that are null, if necessary
      for (const field in recordJSON) {
        if (recordJSON[field] === null) {
          delete recordJSON[field]; // Optionally remove null fields
        }
      }
      return recordJSON;
    });

    // Check if recordsArray is empty
    if (recordsArray.length === 0) {
      console.log(`No records found for ${modelName}, skipping Typesense import.`);
      continue; // Skip to the next model
    }

    // Import data into Typesense
    await typeSenseClient
      .collections(modelName)
      .documents()
      .import(recordsArray);
    console.log(`Synced ${modelName} data to Typesense`);
  }
}

// Export functions
module.exports = {
  generateTypeSenseSchemas,
};
