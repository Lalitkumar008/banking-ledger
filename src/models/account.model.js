//one user can have multiple accounts
const mongoose = require("mongoose");
const ledgerModel = require("../models/ledger.model");
const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "user",
      required: [true, "account must be associated with user"],
      //   to retrieve value faster
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "CLOSED", "FROZEN"],
        message: "status can be active,closed or frozen",
      },
      default: "ACTIVE",
    },
    currency: {
      type: String,
      required: [true, "cuurency is required"],
      default: "INR ",
    },
  },
  {
    timestamps: true,
  },
);
// compound index
const accountIndex = accountSchema.index({ user: 1, status: 1 });

accountSchema.methods.getBalance = async function () {
  const balanceData = await ledgerModel.aggregate([
    { $match: { account: this._id } },
    {
      $group: {
        _id: null,
        totalDebit: {
          $sum: {
            $cond: [{ $eq: ["$type", "DEBIT"] }, "$amount", 0],
          },
        },
        totalCredit: {
          $sum: {
            $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        balance: { $subtract: ["$totalCredit", "$totalDebit"] },
      },
    },
  ]);

  // when user account is new i.e the balance is 0 ,then i returns an empty array
  if (balanceData.length === 0) {
    return 0;
  }
  return balanceData[0].balance;
};

const accountModel = mongoose.model("account", accountSchema);
module.exports = accountModel;
