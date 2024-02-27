const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
        isActive: { type: Boolean, default: true },
    subCategories:[{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }]
  },
  { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
