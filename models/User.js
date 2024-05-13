const mongoose = require("mongoose");
const Detail = require("./Registery");
const Product = require("./Product");
const Order = require("./Order");

// ADDRESS SCHEMA

const addressSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  address: { type: String, trim: true },
  locality: { type: String, trim: true },
  district: { type: String, trim: true },
  state: { type: String, trim: true },
  country: { type: String, trim: true },
  pin: { type: String, trim: true },
  mobile: { type: String, trim: true },
  alt_mobile: { type: String, trim: true },
  nickname: { type: String, trim: true },
  landmark: { type: String, trim: true },
});

// CART SCHEMA

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Types.ObjectId, ref: "Product" },
  quantity: { type: Number, trim: true, default: 1 },
  format: { type: mongoose.Types.ObjectId, ref: "Detail" },
  language: { type: mongoose.Types.ObjectId, ref: "Detail" },
});

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, default: null },
  orderId: { type: mongoose.Types.ObjectId, ref: "Order", default: null },
  razorpayOrderId: { type: String, default: null },
  amount: { type: Number, required: true },
  transactionType: { type: String, enum: ["credit", "debit"], required: true },
  date: { type: Date, default: Date.now },
  paymentStatus: {
    type: String,
    enum: ["cancelled", "failed", "success"],
    required: true,
  },
});

const walletSchema = new mongoose.Schema({
  totalAmount: { type: Number, trim: true, default: 0 },
  isActive: {
    type: Boolean,
    default: true,
  },
  transactionLog: [transactionSchema],
  name: { type: String, default: "My Wallet" },
  pin: { type: String, required: true },
});

// CUSTOMER SCHEMA

const userSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true, trim: true },
    password: { type: String, required: true },
    last_name: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    isAdmin: { type: Boolean, default: false },
    mobile: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      trim: true,
      unique: true,
    },
    address: [addressSchema],
    cart: [cartItemSchema],
    wallet: walletSchema,
    wishlist: [
      {
        product: {
          type: mongoose.Types.ObjectId,
          ref: "Product",
        },
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
    profilePicture: {
      data: Buffer,
      contentType: String,
    },
    orders: [{ type: mongoose.Types.ObjectId, ref: "Order", required: true }],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
