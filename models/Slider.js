const mongoose = require("mongoose");

const sliderSchema = new mongoose.Schema(
  {
    heading: { type: String },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    urlText: { type: String },
    urlLink: { type: String },
    image: { type: String },
  },
  { timestamps: true }
);

const Slider = mongoose.model("Slider", sliderSchema);

module.exports = Slider;
