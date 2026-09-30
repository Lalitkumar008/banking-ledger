const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendRegistrationEmail } = require("../services/email.service");
const { tokenBlackListModel } = require("../models/tokenBlackList.model");

async function registerUser(req, res) {
  try {
    const { email, name, password } = req.body;
    const isUserExist = await userModel.findOne({ email });

    if (isUserExist)
      return res.status(422).json({
        msg: "email already regsitered",
      });

    // no need of hashing password here as we have done it in the userModel.js

    //creating user
    const user = await userModel.create({
      email,
      name,
      password,
    });
    const token = await jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "3d" },
    );

    res.cookie("token", token);

    await sendRegistrationEmail(user.email, user.name);

    return res.status(201).json({
      msg: "user created successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      msg: error.message,
    });
  }
}

// login user
async function loginUser(req, res) {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email }).select("+password");
  if (!user) {
    return res.status(401).json({
      msg: "invalid email",
    });
  }

  const validPass = await user.comparePassword(password);
  if (!validPass) {
    return res.status(401).json({
      msg: "invalid credential",
    });
  }

  const token = await jwt.sign(
    {
      userId: user._id,
    },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: "3d",
    },
  );

  res.cookie("token", token);

  return res.status(200).json({
    msg: "user logged in successfully",
    user: {
      id: user._id,
      email: user.email,
      password: user.password,
    },
  });
}

// logout
async function logoutUser(req, res) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(400).json({
      message: "User logged out successfully",
    });
  }

  await tokenBlackListModel.create({
    token: token,
  });

  res.clearCookie("token");

  res.status(200).json({
    msg: "logged out successfully",
  });
}
module.exports = { registerUser, loginUser, logoutUser };
