const mongoose = require("mongoose");

const tokenBlackListSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      require: [true, "Token is required"],
      unique: [true, "Token is already blacklisted"],
    },
    // blackListedAt:{
    //     type:Date,
    //     default:Date.now,
    //     immutable:true
    // }
  },
  {
    timestamps: true,
  },
);

tokenBlackListSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24 * 3, //3 days
  },
);

const tokenBlackListModel = mongoose.model(
  "tokenBlackList",
  tokenBlackListSchema,
);

module.exports = { tokenBlackListModel };
