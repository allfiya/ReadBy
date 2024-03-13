const User = require("../models/User");
const router = require("express").Router();
const Category = require("../models/Category");
const Detail = require("../models/Detail");
const Registery = require("../models/Registery");
const Product = require("../models/Product");

router.get("/library", async (req, res) => {
  const customer = req.session.customer;
  const mainCategories = await Category.find({ parent: null });
  const languages = await Detail.find({ field: "language" });
  const authors = await Registery.find({ role: "author" });
  const formats = await Detail.find({ field: "format" });
  const publishers = await Registery.find({ role: "publisher" });
  const totalCount = await Product.countDocuments();

  const page = req.query.p || 0;
  const perPage = 12;
  let pageCount;

  if (totalCount % perPage === 0) {
    pageCount = parseInt(totalCount / perPage);
  } else {
    pageCount = parseInt(totalCount / perPage + 1);
  }

  const products = await Product.find()
    .skip(page * perPage)
    .limit(perPage);

  if (products.length > 0) {
    res.render("library", {
      customer,
      mainCategories,
      languages,
      authors,
      formats,
      publishers,
      products,
      pageCount,
      page: parseInt(page),
    });
  } else {
    res.render("404");
  }
});

router.get('/view/:id', async (req, res) => {
    const product = await Product.findOne({ _id: req.params.id })
    res.render('product_detail',{product})
})

module.exports = router;
