const mongoose = require("mongoose");

const detailSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    field: {
      type: String,
      enum: ["format", "language","award"],
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Detail = mongoose.model("Detail", detailSchema);

module.exports = Detail;
