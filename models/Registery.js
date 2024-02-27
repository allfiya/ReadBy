const mongoose = require("mongoose");

const registerySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["publisher", "author"],
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Registery = mongoose.model("Registery", registerySchema);

module.exports = Registery;
