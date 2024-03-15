const mongoose = require("mongoose");
const Registery = require("./Registery");
const Category = require("./Category");
const Detail = require("./Detail");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    author: [{ type: mongoose.Schema.Types.ObjectId, ref: "Registery" }],
    formats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Detail" }],
    languages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Detail" }],
    stock: {
      type: Map,
      of: {
        type: Map,
        of: Number,
      },
    },
    description: { type: String, required: true, trim: true },
    basePrice: {
      type: Map,
      of: Number,
    },
    salePrice: {
      type: Map,
      of: Number,
    },
    images: [String],
    isbn: { type: String, trim: true },
    publisher: { type: mongoose.Schema.Types.ObjectId, ref: "Registery" },
    mainCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    publicationDate: Date,
    awards: [
      {
        award: { type: mongoose.Schema.Types.ObjectId, ref: "Detail" },
        year: { type: String, required: true },
      },
    ],
    isActive: { type: Boolean, default: true },
    totalOrders: { type: Number, default: 0 },
    discount: {
      isActive: { type: Boolean, default: false },
      percentage: Number,
      expiry: Date,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
