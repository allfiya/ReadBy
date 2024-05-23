const mongoose = require("mongoose");
const Registery = require("./Registery");
const Category = require("./Category");
const User = require("./User");

const statusValues = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

const paymentMethods = ["COD", "Razor Pay", "Wallet"];

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Types.ObjectId, ref: "Product" },
  quantity: { type: Number, trim: true, default: 1 },
  format: { type: mongoose.Types.ObjectId, ref: "Detail" },
  language: { type: mongoose.Types.ObjectId, ref: "Detail" },
  perOrderPrice: { type: Number, trim: true },
});

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

const ReturnSchema = new mongoose.Schema({
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["requested", "approved", "rejected", "picked up", "completed","refunded"],
    default: "requested",
  },
  refund: {
    type: String,
    enum: ["failed", "success"],
  },
  proof: { type: [String], default: [] },
  bankAccountDetails: {
    holderName: { type: String },
    accountNumber: { type: String },
    bankName: { type: String },
    branchName: { type: String },
    ifsc: { type: String },
    contactNumber: { type: String },
  },
  returnAuthorization: {
    shippingAddress: addressSchema,
    returnLabel: { type: String },
  },
});

const paymentStatusValues = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "cancelled",
];

const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: statusValues, default: "pending" },
    delivered_at: { type: Date, default: null },
    items: [orderItemSchema],
    totalAmount: { type: Number },
    shippingAddress: { type: addressSchema },
    paymentMethod: { type: String, enum: paymentMethods },
    paymentStatus: {
      type: String,
      enum: paymentStatusValues,
      default: "pending",
    },
    cancelled_at: { type: Date, default: null },
    paymentId: { type: String, default: null }, // Razorpay payment ID after successful payment
    cancelled_reason: { type: String, default: null },
    cancellationRequest: {
      type: Boolean,
      default: false,
    },
    razorpayOrderId: { type: String, default: null },
    fromWallet: { type: Number, default: null },
    refundToWallet: {
      type: Boolean,
      default: false,
    },
    refundToAccount: {
      type: Boolean,
      default: false,
    },
    returned: {
      type: Boolean,
      default: false,
    },
    isCancelledautomatically: {
      type: Boolean,
      default: false,
    },
    refundStatus: {
      type: String,
      enum: ["pending", null, "processed", "failed"],
      default: null,
    },
    return: ReturnSchema,
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
