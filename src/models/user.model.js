const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "email is required for creating a user"],
      trim: true,
      unique: [true, "email already exist"],
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Invalid email address",
      ],
    },
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: [true, "password is required"],
      minlength: [6, "password should contain more than 6 characters"],
      // select means when we are retrieving data,we should not get it in response
      select: false,
    },
    systemUser: {
      type: Boolean,
      default: false,
      immutable: true,
      select: false,
    },
  },
  // when user was created or updated,log the timstamp
  { timestamps: true },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
  return;
  // next can be used only when async function is not there
  // return next();
});

userSchema.methods.comparePassword = async function (password) {
  // return true or false
  return await bcrypt.compare(password, this.password);
};

const userModel = mongoose.model("user", userSchema);
module.exports = userModel;
