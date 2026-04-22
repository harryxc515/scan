const mongoose = require("mongoose");
const config = require("../config");

async function connectDB() {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log("mongodb connected:", config.MONGO_URI);
  } catch (err) {
    console.error("mongodb connection error:", err.message);
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => {
    console.warn("mongodb disconnected. retrying...");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("mongodb reconnected");
  });
}

module.exports = connectDB;
