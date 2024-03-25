const User = require("../models/User");
const router = require("express").Router();
const Category = require("../models/Category");
const Detail = require("../models/Detail");
const Registery = require("../models/Registery");
const Product = require("../models/Product");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const Slider = require("../models/Slider");

const isAuthenticated = (req, res, next) => {
  if (req.session.customer) {
    next();
  } else {
    res.redirect(req.originalUrl);
  }
};

// GET ROUTES

router.get("/library", async (req, res) => {
  const cartItems = JSON.parse(req.cookies.cartItems || "[]");
  const customer = req.session.customer;
  const mainCategories = await Category.find({ parent: null });
  const languages = await Detail.find({ field: "language" });
  const authors = await Registery.find({ role: "author" });
  const formats = await Detail.find({ field: "format" });
  const publishers = await Registery.find({ role: "publisher" });
  
  let totalCount;
  let pageCount;
  const page = req.query.p || 0;
  const perPage = 12;

  const filterLanguages = req.query.language || [];
  const filterAuthors = req.query.author || [];
  const filterFormats = req.query.format || [];
  const filterPublishers = req.query.publisher || [];

  let filterCriteria = [];
  if (
    filterLanguages.length > 0 ||
    filterAuthors.length > 0 ||
    filterFormats.length > 0 ||
    filterPublishers.length > 0
  ) {
    if (filterLanguages.length > 0) {
      filterCriteria.push({ languages: { $all: filterLanguages } });
    }
    if (filterAuthors.length > 0) {
      filterCriteria.push({ author: { $in: filterAuthors } });
    }
    if (filterFormats.length > 0) {
      filterCriteria.push({ formats: { $in: filterFormats } });
    }
    if (filterPublishers.length > 0) {
      filterCriteria.push({ publisher: { $in: filterPublishers } });
    }

    totalCount = await Product.countDocuments({
      $and: filterCriteria,
    });
  } else {
    totalCount = await Product.countDocuments();
  }

  if (totalCount % perPage === 0) {
    pageCount = parseInt(totalCount / perPage);
  } else {
    pageCount = parseInt(totalCount / perPage + 1);
  }

  let productsQuery = Product.find();

  if (
    filterLanguages.length > 0 ||
    filterAuthors.length > 0 ||
    filterFormats.length > 0 ||
    filterPublishers.length > 0
  ) {
    productsQuery = productsQuery.and(filterCriteria);
  }

  let sortOption = req.query.sort;
  let sortCriteria = {};
  if (sortOption === "priceLowToHigh") {
    sortCriteria = { salePrice: 1 }; // Assuming salePrice is a Map, this sorts by the lowest sale price
  } else if (sortOption === "priceHighToLow") {
    sortCriteria = { salePrice: -1 }; // Sorts by highest sale price
  }

  const products = await productsQuery
    .sort(sortCriteria)
    .skip(page * perPage)
    .limit(perPage)
    .exec();

  if (customer && products.length > 0) {
    try {
      const customerDb = await User.findOne({ _id: customer._id })
        .populate("cart.product")
        .populate("cart.format")
        .populate("cart.language");

      if (!customerDb) {
        return res.status(404).send("User not found");
      }

      res.render("library", {
        customer,
        mainCategories,
        customerDb,
        languages,
        authors,
        formats,
        publishers,
        products,
        pageCount,
        cartItems,
        page: parseInt(page),
        filterLanguages,
        filterAuthors,
        filterFormats,
        filterPublishers,
        sliders,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  } else if (products.length > 0) {
    res.render("library", {
      customer,
      mainCategories,
      languages,
      authors,
      formats,
      publishers,
      products,
      pageCount,
      cartItems,
      page: parseInt(page),
      filterLanguages,
      filterAuthors,
      filterFormats,
      filterPublishers,
      sliders,
    });
  } else {
    res.render("404");
  }
});

router.get("/profile", isAuthenticated, async (req, res) => {
  const mainCategories = await Category.find({ parent: null });
  const customer = req.session.customer;

  if (customer) {
    try {
      const customerDb = await User.findOne({ _id: customer._id })
        .populate("cart.product")
        .populate("cart.format")
        .populate("cart.language");

      if (!customerDb) {
        return res.status(404).send("User not found");
      }

      res.render("profile", {
        customer,
        mainCategories,
        customerDb,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.render("profile", {
      customer,
      mainCategories,
    });
  }

  //   res.render("profile", { mainCategories,customer });
});

router.get("/view/:id", async (req, res) => {
  const productId = req.params.id;
  try {
    const product = await Product.findOne({ _id: productId })
      .populate("formats")
      .populate("languages");
    const mainCategories = await Category.find({ parent: null });
    const cartItems = JSON.parse(req.cookies.cartItems || "[]");
    // Store the product object in recentlyViewed cookie
    let recentlyViewed = JSON.parse(req.cookies.recentlyViewed || "[]");
    // Check if the product ID is already in the array, if not, add it
    const foundProductIndex = recentlyViewed.findIndex(
      (item) => item._id === productId
    );
    if (foundProductIndex === -1) {
      recentlyViewed.push({
        _id: product._id,
        title: product.title,
        basePrice: product.basePrice,
        salePrice: product.salePrice,
      });
    }
    // Limit the recently viewed products to a certain number, e.g., 4
    if (recentlyViewed.length > 4) {
      recentlyViewed = recentlyViewed.slice(recentlyViewed.length - 4);
    }
    const oneMonth = 30 * 24 * 60 * 60 * 1000;
    res.cookie("recentlyViewed", JSON.stringify(recentlyViewed), {
      maxAge: oneMonth,
      httpOnly: false,
      secure: false,
    });
    const customer = req.session.customer;

    if (customer) {
      try {
        const customerDb = await User.findOne({ _id: customer._id })
          .populate("cart.product")
          .populate("cart.format")
          .populate("cart.language");
        if (!customerDb) {
          return res.status(404).send("User not found");
        }
        res.render("product_detail", {
          product,
          mainCategories,
          customer,
          customerDb,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
      }
    } else {
      // If not logged in, only render the product details without updating recentlyViewed
      res.render("product_detail", {
        product,
        mainCategories,
        customer,
        cartItems,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/cart", async (req, res) => {
  const customer = req.session.customer;
  const mainCategories = await Category.find({ parent: null });

  const cartItems = JSON.parse(req.cookies.cartItems || "[]");

  if (customer) {
    try {
      const customerDb = await User.findOne({ _id: customer._id })
        .populate("cart.product")
        .populate("cart.format")
        .populate("cart.language");

      if (!customerDb) {
        return res.status(404).send("User not found");
      }

      res.render("cart", { customer, mainCategories, customerDb });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.render("cart", { customer, cartItems, mainCategories });
  }
});

router.get("/getSubcategories", async (req, res) => {
  const categoryId = req.query.categoryId;
  const subcategories = await Category.find({ parent: categoryId });
  res.json(subcategories);
});

// POST ROUTES

router.post("/add-to-cookie", async (req, res, next) => {
  const productId = req.body.product;

  const formatId = req.body.formatId;
  const languageId = req.body.languageId;
  const formatObjectId = new mongoose.Types.ObjectId(formatId);
  const languageObjectId = new mongoose.Types.ObjectId(languageId);

  const formatDoc = await Detail.findOne({ _id: formatObjectId });
  const format = formatDoc.name;
  const languageDoc = await Detail.findOne({ _id: languageObjectId });
  const language = languageDoc.name;
  // Retrieve existing cart items from the cookies or initialize an empty array
  let cartItems = JSON.parse(req.cookies.cartItems || "[]");

  // Check if the cart already contains the same item
  const existingCartItemIndex = cartItems.findIndex(
    (item) =>
      item.productId === productId &&
      item.formatId === formatId &&
      item.languageId === languageId
  );

  if (existingCartItemIndex !== -1) {
    // If the item already exists, increment its quantity
    cartItems[existingCartItemIndex].quantity += 1;
  } else {
    // Otherwise, create a new cart item and push it to the cart items array
    const product = await Product.findOne({ _id: productId });
    const title = product.title;
    const price = product.salePrice.get(formatId);

    const cartItem = {
      title: title,
      price: price,
      format: format,
      language: language,
      productId: productId,
      formatId: formatId,
      languageId: languageId,
      quantity: 1,
    };

    cartItems.push(cartItem);
  }

  // Set cookie max age to one month in milliseconds
  const oneMonth = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

  // Update the cartItems cookie with the updated cart items array and set max age
  res.cookie("cartItems", JSON.stringify(cartItems), {
    maxAge: oneMonth,
    httpOnly: false,
    secure: false,
  });

  res.redirect("/cart");
});

router.post("/add-to-cart", async (req, res, next) => {
  const customer = req.session.customer;
  const customerDb = await User.findOne({ _id: customer._id });
  const productId = req.body.productId;
  const formatId = req.body.formatId;
  const languageId = req.body.languageId;

  // Check if the cart already contains the same item
  const existingCartItem = customerDb.cart.find(
    (item) =>
      String(item.product) === String(productId) &&
      String(item.format) === String(formatId) &&
      String(item.language) === String(languageId)
  );

  if (existingCartItem) {
    // If the item already exists, increment its quantity
    existingCartItem.quantity += 1;
  } else {
    // Otherwise, create a new cart item
    const cartItem = {
      product: productId,
      format: formatId,
      language: languageId,
      quantity: 1,
    };
    customerDb.cart.push(cartItem);
  }

  await customerDb.save();

  res.redirect("/cart");
});

router.post("/cart/increment", async (req, res) => {
  const userId = req.session.customer._id;
  const itemId = req.body.itemId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const cartItem = user.cart.find((item) => item._id.toString() === itemId);
    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    // Increment quantity
    cartItem.quantity += 1;

    // Save user back to the database
    await user.save();

    res.status(200).json({
      message: "Quantity incremented successfully",
      cartItem: cartItem,
    });
  } catch (error) {
    console.error("Error incrementing quantity:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/cart/decrement", async (req, res) => {
  const userId = req.session.customer._id;
  const itemId = req.body.itemId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const cartItem = user.cart.find((item) => item._id.toString() === itemId);
    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    if (cartItem.quantity > 1) {
      cartItem.quantity -= 1;

      // Save user back to the database
      await user.save();
    }

    res.status(200).json({
      message: "Quantity decremented successfully",
      cartItem: cartItem,
    });
  } catch (error) {
    console.error("Error decrementing quantity:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/cart/updateInput", async (req, res) => {
  const userId = req.session.customer._id;
  const itemId = req.body.itemId;
  const newQuantity = req.body.newQuantity;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const cartItem = user.cart.find((item) => item._id.toString() === itemId);
    if (!cartItem) {
      return res.status(404).json({ error: "Cart item not found" });
    }

    cartItem.quantity = newQuantity;

    // Save user back to the database
    await user.save();

    res
      .status(200)
      .json({ message: "Quantity updated successfully", cartItem: cartItem });
  } catch (error) {
    console.error("Error updating quantity:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
