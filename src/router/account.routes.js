const express = require("express");
const {
  authMiddleware,
  authSystemUserMiddleware,
} = require("../middlewares/auth.middleware");
const {
  createAccountController,
  getAllAccountsController,
  getAccountBalanceController,
} = require("../controllers/account.controller");
const router = express.Router();

// post /api/accounts
// create a new account
//protected route means a token is required

router.post("/", authMiddleware, createAccountController);

// get all accounts of the logged in user
router.get("/", authMiddleware, getAllAccountsController);

// fetch balance of the logged in user /api/account/balance/:accountId
router.get("/balance/:accountId", authMiddleware, getAccountBalanceController);

module.exports = router;
