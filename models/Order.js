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
];

const paymentMethods = ["upi", "net_banking", "card", "cod", "Razor Pay"];

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

const paymentStatusValues = ["pending", "paid", "failed", "refunded"];

const orderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: { type: String, enum: statusValues, default: "pending" },
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
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
