const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    format: { type: mongoose.Schema.Types.ObjectId, ref: "Detail" },
    language: { type: mongoose.Schema.Types.ObjectId, ref: "Detail" },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    shortReview: {
      type: String,
      required: false,
    },
    longReview: {
      type: String,
      required: false,
    },
    likes: {
      type: Number,
    },
    dislikes: {
      type: Number,
    },
    images: [String],
  },
  { timestamps: true }
);

const Rating = mongoose.model("Rating", ratingSchema);

module.exports = Rating;
