const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("connected to db");
  } catch (error) {
    console.log("error connecting to db", error);
    process.exit(1);
  }
}
module.exports = { connectDB };
