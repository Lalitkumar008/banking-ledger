const express = require("express");
const {
  authMiddleware,
  authSystemUserMiddleware,
} = require("../middlewares/auth.middleware");
const {
  createTransaction,
  createInitialFundsTransaction,
} = require("../controllers/transaction.controller");
const router = express.Router();

// creating a transaction
router.post("/", authMiddleware, createTransaction);

//initial funds
router.post(
  "/system/initial-funds",
  authSystemUserMiddleware,
  createInitialFundsTransaction,
);
module.exports = router;
