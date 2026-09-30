const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const { tokenBlackListModel } = require("../models/tokenBlackList.model");

async function authMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({
      msg: "token is missing",
    });
  }

  // checking token blacklisting
  const isBlackListed = await tokenBlackListModel.findOne({ token });
  if (isBlackListed) {
    return res.status(401).json({
      msg: "Unauthorized token is invalid",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    const user = await userModel.findById({ _id: decoded.userId });
    req.user = user;

    return next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      messgae: "Unauthorized access,token is invalid",
    });
  }
}

//system user middleware
async function authSystemUserMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      message: "Unauthorized access,token is missing",
    });
  }

  const isBlackListed = await tokenBlackListModel.findOne({ token });
  if (isBlackListed) {
    return res.status(401).json({
      msg: "Unauthorized token is invalid",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    // systemUser is by default false therefore "+systemUser"
    const user = await userModel.findById(decoded.userId).select("+systemUser");

    if (!user.systemUser) {
      return res.status(403).json({
        message: "Forbidden access,not a system user",
      });
    }

    req.user = user;
  } catch (error) {
    console.log(error);
    return res.status(401).json({
      message: "Unauthorized access , token is invalid",
    });
  }

  next();
}

module.exports = { authMiddleware, authSystemUserMiddleware };
