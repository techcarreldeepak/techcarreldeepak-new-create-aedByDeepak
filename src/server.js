const http = require("http");
const dotenv = require("dotenv");
const app = require("./app");
const {sequelize} = require("./config/database");
const { generateTypeSenseSchemas } = require("./middleware/typeSence");

dotenv.config();

const server = http.createServer(app);

const syncDatabase = async () => {
  try {
    console.log(sequelize.models);
    await sequelize.sync({ force: false });
    console.log("Database synchronized successfully.");
  } catch (error) {
    console.error("Error synchronizing database:", error);
    throw error;
  }
};

const findAvailablePort = (startPort, maxAttempts = 10) => {
  return new Promise((resolve, reject) => {
    let currentPort = startPort;
    let attempts = 0;

    const tryPort = (port) => {
      server.listen(port, () => {
        server.once("close", () => {
          resolve(port);
        });
        server.close();
      });

      server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          console.log(`Port ${port} is in use, trying another...`);
          if (attempts < maxAttempts) {
            attempts++;
            tryPort(port + 1);
          } else {
            reject(new Error("Unable to find an available port"));
          }
        } else {
          reject(err);
        }
      });
    };

    tryPort(currentPort);
  });
};

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Database connection has been established successfully.");

    // await syncDatabase();

    const startPort = parseInt(process.env.PORT || 3000);
    const port = await findAvailablePort(startPort);

    server.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      try {
        // generateTypeSenseSchemas(); // Ensure schema sync
      } catch (err) {
        console.error("Error generating Typesense schemas:", err);
      }
    });
  } catch (error) {
    console.error("Unable to start the server:", error);
    process.exit(1);
  }
}

startServer();

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    sequelize.close().then(() => {
      console.log("Database connection closed");
      process.exit(0);
    });
  });
});

module.exports = { server };
