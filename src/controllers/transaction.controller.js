const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");
/**
 * - Create a new transaction
 * THE 10-STEP TRANSFER FLOW:
 *   1. Validate request
 *   2. Validate idemPotency key
 *   3. Check account status
 *   4. Derive sender balance from ledger
 *   5. Create transaction (PENDING)
 *   6. Create DEBIT ledger entry
 *   7. Create CREDIT ledger entry
 *   8. Mark transaction COMPLETED
 *   9. Commit MongoDB session
 *   10. Send email notification
 */

// creating a transaction for user
async function createTransaction(req, res) {
  const { toAccount, fromAccount, idemPotencyKey, amount } = req.body;

  // 1.validate request
  if (!toAccount || !fromAccount || !idemPotencyKey || !amount) {
    return res.status(400).json({
      msg: "toAccount, fromAccount, idemPotencyKey, amount is required",
    });
  }

  const fromUserAccount = await accountModel.findOne({
    _id: fromAccount,
  });
  const toUserAccount = await accountModel.findOne({
    _id: toAccount,
  });

  if (!fromUserAccount || !toUserAccount) {
    return res.status(400).json({
      msg: "fromAccount or toAccount is invalid",
    });
  }

  // 2.validate idemPotencyKey
  const isTransactionAlreadyExists = await transactionModel.findOne({
    idemPotencyKey: idemPotencyKey,
  });
  if (isTransactionAlreadyExists === "COMPLETED") {
    return res.status(200).json({
      msg: "transaction successful",
      transaction: isTransactionAlreadyExists,
    });
  } else if (isTransactionAlreadyExists === "PENDING") {
    return res.status(200).json({
      msg: "transaction in progress",
    });
  } else if (isTransactionAlreadyExists === "FAILED") {
    return res.status(200).json({
      msg: "transaction failed ,please retry",
    });
  } else if (isTransactionAlreadyExists === "PENDING") {
    return res.status(200).json({
      msg: "transaction in progress",
    });
  } else if (isTransactionAlreadyExists === "REVERSED") {
    return res.status(200).json({
      msg: "transaction reversed , please retry",
    });
  }

  //3.check status of both from and to accounts
  if (
    fromUserAccount.status !== "ACTIVE" &&
    toUserAccount.status !== "ACTIVE"
  ) {
    return res.status(400).json({
      msg: "both accounts must be active for transaction",
    });
  }

  //4.derive sender's balance from account for insufficient balance check
  const balance = await fromUserAccount.getBalance();
  if (balance < amount) {
    return res.status(400).json({
      message: `Insufficient balance in sender's accountId
      current balance is ${balance}.Requested amount is ${amount}
      `,
    });
  }

  let transaction;
  //5.Create transaction (PENDING)
  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    // const transaction = await transactionModel.create we will not direct create transaction in db but first at client side
    transaction = (
      await transactionModel.create(
        [
          {
            fromAccount,
            toAccount,
            amount,
            idemPotencyKey,
            status: "PENDING",
          },
        ],
        { session },
      )
    )[0];

    //6.creating debit ledger entry
    const debitLedgerEntry = await ledgerModel.create(
      [
        {
          account: fromAccount,
          amount,
          transaction: transaction._id,
          type: "DEBIT",
        },
      ],
      { session },
    );
    await (() => {
      return new Promise((resolve) => setTimeout(resolve, 1000 * 5));
    })();

    //6.creating credit ledger entry
    const creditLedgerEntry = await ledgerModel.create(
      [
        {
          account: toAccount,
          amount,
          transaction: transaction._id,
          type: "CREDIT",
        },
      ],
      { session },
    );

    //7.completing a transaction
    // transaction.status = "COMPLETED";
    // await transaction.save({ session });
    await transactionModel.findOneAndUpdate(
      { _id: transaction._id },
      { status: "COMPLETED" },
      { session },
    );

    //8.comminting transaction
    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    await transactionModel.findOneAndUpdate(
      { idemPotencyKey: idemPotencyKey },
      { status: "FAILED" },
    );

    return res.status(500).json({
      msg: "Transaction already in pending ,please retry after some time",
      error: error.message,
    });
  }
  //9.send email notification
  await emailService.sendTransactionSuccessEmail(
    req.user.email,
    req.user.name,
    amount,
  );

  return res.status(201).json({
    msg: "Transaction completed successfully",
    transaction: transaction,
  });
}

// creating a transaction from sytem user account
async function createInitialFundsTransaction(req, res) {
  const { toAccount, amount, idemPotencyKey } = req.body;
  if (!toAccount || !amount || !idemPotencyKey) {
    return res.status(400).json({
      message: "toAccount,amount and idemPotencyKey are required",
    });
  }

  //checking if toAccount is valid or not
  const toUserAccount = await accountModel.findOne({
    _id: toAccount,
  });
  if (!toUserAccount) {
    return res.status(400).json({
      msg: "Invalid toAccount",
    });
  }

  //checking for s system account
  const fromUserAccount = await accountModel.findOne({
    user: req.user._id,
  });

  //rarest case if systemUser somehow gets deleted
  if (!fromUserAccount) {
    return res.status(400).json({
      msg: "cannot find fromAccount or systemUSer account",
    });
  }

  //starting a session after passing all checks above
  const session = await mongoose.startSession();
  session.startTransaction();

  // const transaction = await transactionModel.create we will not direct create transaction in db but first at client side
  const transaction = new transactionModel({
    fromAccount: fromUserAccount._id,
    toAccount,
    amount,
    idemPotencyKey,
    status: "PENDING",
  });

  //   creating ledger entries
  // always data in array
  const debitLedgerEntry = await ledgerModel.create(
    [
      {
        account: fromUserAccount._id,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT",
      },
    ],
    { session },
  );

  const creditLedgerEntry = await ledgerModel.create(
    [
      {
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT",
      },
    ],
    { session },
  );

  //completing transaction
  transaction.status = "COMPLETED";
  await transaction.save({ session });

  await session.commitTransaction();
  session.endSession();

  return res.status(201).json({
    msg: "Initial funds transaction completed successful",
    transaction: transaction,
  });
}

module.exports = { createTransaction, createInitialFundsTransaction };
