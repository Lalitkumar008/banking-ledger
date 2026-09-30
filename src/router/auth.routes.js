const express = require("express");

const {
  registerUser,
  loginUser,
  logoutUser,
} = require("../controllers/auth.controller");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

// logout and token blacklisting
router.post("/logout", logoutUser);
module.exports = router;
