const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const app = express();

//routes
const authRoutes = require("../src/router/auth.routes");
const accountRoutes = require("../src/router/account.routes");
const transactionRoutes = require("../src/router/transaction.routes");

app.use(cors());

app.use(express.json());
app.use(cookieParser());

//testing route
app.get("/", (req, res) => {
  res.send("banking ledger running");
});

//app.use routes
app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/transaction", transactionRoutes);

module.exports = app;
