const User = require("../models/User");
const router = require("express").Router();
const Category = require("../models/Category");
const Detail = require("../models/Detail");
const Registery = require("../models/Registery");
const Product = require("../models/Product");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const Slider = require("../models/Slider");
const Order = require("../models/Order");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const isAuthenticated = (req, res, next) => {
  if (req.session.customer) {
    next();
  } else {
    res.redirect(req.originalUrl);
  }
};

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID, // Your Razorpay key ID
  key_secret: process.env.RAZORPAY_KEY_SECRET, // Your Razorpay key secret
});

// GET ROUTES

// router.get("/library", async (req, res) => {
//   const cartItems = JSON.parse(req.cookies.cartItems || "[]");
//   const customer = req.session.customer;
//   const mainCategories = await Category.find({ parent: null });
//   const languages = await Detail.find({ field: "language" });
//   const authors = await Registery.find({ role: "author" });
//   const formats = await Detail.find({ field: "format" });
//   const publishers = await Registery.find({ role: "publisher" });

//   let totalCount;
//   let pageCount;
//   const page = req.query.p || 0;
//   const perPage = 12;

//   const filterLanguages = req.query.language || [];
//   const filterAuthors = req.query.author || [];
//   const filterFormats = req.query.format || [];
//   const filterPublishers = req.query.publisher || [];

//   let filterCriteria = [];
//   if (
//     filterLanguages.length > 0 ||
//     filterAuthors.length > 0 ||
//     filterFormats.length > 0 ||
//     filterPublishers.length > 0
//   ) {
//     if (filterLanguages.length > 0) {
//       filterCriteria.push({ languages: { $all: filterLanguages } });
//     }
//     if (filterAuthors.length > 0) {
//       filterCriteria.push({ author: { $in: filterAuthors } });
//     }
//     if (filterFormats.length > 0) {
//       filterCriteria.push({ formats: { $in: filterFormats } });
//     }
//     if (filterPublishers.length > 0) {
//       filterCriteria.push({ publisher: { $in: filterPublishers } });
//     }

//     totalCount = await Product.countDocuments({
//       $and: filterCriteria,
//     });
//   } else {
//     totalCount = await Product.countDocuments();
//   }

//   if (totalCount % perPage === 0) {
//     pageCount = parseInt(totalCount / perPage);
//   } else {
//     pageCount = parseInt(totalCount / perPage + 1);
//   }

//   let productsQuery = Product.find();

//   if (
//     filterLanguages.length > 0 ||
//     filterAuthors.length > 0 ||
//     filterFormats.length > 0 ||
//     filterPublishers.length > 0
//   ) {
//     productsQuery = productsQuery.and(filterCriteria);
//   }

//   let sortOption = req.query.sort;
//   let sortCriteria = {};
//   if (sortOption === "priceLowToHigh") {
//     sortCriteria = { salePrice: 1 }; // Assuming salePrice is a Map, this sorts by the lowest sale price
//   } else if (sortOption === "priceHighToLow") {
//     sortCriteria = { salePrice: -1 }; // Sorts by highest sale price
//   }

//   const products = await productsQuery
//     .sort(sortCriteria)
//     .skip(page * perPage)
//     .limit(perPage)
//     .populate("subCategory")
//     .exec();

//   if (customer && products.length > 0) {
//     try {
//       const customerDb = await User.findOne({ _id: customer._id })
//         .populate("cart.product")
//         .populate("cart.format")
//         .populate("cart.language");

//       if (!customerDb) {
//         return res.status(404).send("User not found");
//       }

//       res.render("library", {
//         customer,
//         mainCategories,
//         customerDb,
//         languages,
//         authors,
//         formats,
//         publishers,
//         products,
//         pageCount,
//         cartItems,
//         page: parseInt(page),
//         filterLanguages,
//         filterAuthors,
//         filterFormats,
//         filterPublishers,
//       });
//     } catch (error) {
//       console.error(error);
//       res.status(500).send("Internal Server Error");
//     }
//   } else if (products.length > 0) {
//     res.render("library", {
//       customer,
//       mainCategories,
//       languages,
//       authors,
//       formats,
//       publishers,
//       products,
//       pageCount,
//       cartItems,
//       page: parseInt(page),
//       filterLanguages,
//       filterAuthors,
//       filterFormats,
//       filterPublishers,
//     });
//   } else {
//     res.render("404");
//   }
// });

router.get("/library", async (req, res) => {
  try {
    const cartItems = JSON.parse(req.cookies.cartItems || "[]");
    let customer = null;
    const mainCategories = await Category.find({ parent: null });
    const languages = await Detail.find({ field: "language" });
    const authors = await Registery.find({ role: "author" });
    const formats = await Detail.find({ field: "format" });
    const publishers = await Registery.find({ role: "publisher" });

    // Pagination variables
    let totalCount;
    let pageCount;
    const page = req.query.p || 0;
    const perPage = 12;

    // Filtering criteria
    const filterLanguages = req.query.language || [];
    const filterAuthors = req.query.author || [];
    const filterFormats = req.query.format || [];
    const filterPublishers = req.query.publisher || [];
    const searchQuery = req.query.search || "";

    let filterCriteria = [];

    // Construct filter criteria based on selected filters
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
    }

    const processedSearchQuery = searchQuery.replace(/\s+/g, " ").trim();

    if (processedSearchQuery) {
      const searchFilter = {
        $or: [
          { title: { $regex: processedSearchQuery, $options: "i" } }, // Case-insensitive regex match for title
          // Search for authors based on their names
          {
            author: {
              $in: await Registery.find({
                name: { $regex: processedSearchQuery, $options: "i" },
              }).distinct("_id"),
            },
          },
          {
            mainCategory: {
              $in: await Category.find({
                name: { $regex: processedSearchQuery, $options: "i" },
              }).distinct("_id"),
            },
          },
          {
            subCategory: {
              $in: await Category.find({
                name: { $regex: processedSearchQuery, $options: "i" },
              }).distinct("_id"),
            },
          },
        ],
      };
      filterCriteria.push(searchFilter);
    }

    // Count total matching documents based on applied filters
    if (filterCriteria.length > 0) {
      totalCount = await Product.countDocuments({
        $and: filterCriteria,
      });
    } else {
      totalCount = await Product.countDocuments();
    }

    // Calculate total pages for pagination
    if (totalCount % perPage === 0) {
      pageCount = parseInt(totalCount / perPage);
    } else {
      pageCount = parseInt(totalCount / perPage + 1);
    }

    // Query products based on filters, search, and pagination
    let productsQuery = Product.find();

    if (filterCriteria.length > 0) {
      productsQuery = productsQuery.and(filterCriteria);
    }

    // Apply sorting criteria if provided
    let sortOption = req.query.sort;
    let sortCriteria = {};
    if (sortOption === "priceLowToHigh") {
      sortCriteria = { salePrice: 1 }; // Assuming salePrice is a Map, this sorts by the lowest sale price
    } else if (sortOption === "priceHighToLow") {
      sortCriteria = { salePrice: -1 }; // Sorts by highest sale price
    }

    // Execute the query and populate subCategory field
    const products = await productsQuery
      .sort(sortCriteria)
      .skip(page * perPage)
      .limit(perPage)
      .populate("subCategory")
      .exec();

    if (req.session.customer) {
      customer = await User.findById(req.session.customer._id);
    }

    // Render the page with the products and other data
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
      searchQuery,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/profile", isAuthenticated, async (req, res) => {
  const mainCategories = await Category.find({ parent: null });
  let customer = null;
  try {
    if (req.session.customer) {
      customer = await User.findById(req.session.customer._id)
        .populate("cart.product")
        .populate("cart.format")
        .populate("cart.language");

      res.render("profile", {
        customer,
        mainCategories,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// router.get("/view/:id", async (req, res) => {
//   const productId = req.params.id;
//   try {
//     const product = await Product.findOne({ _id: productId })
//       .populate("formats")
//       .populate("languages");

//     const similarProducts = await Product.find({
//       subCategory: product.subCategory,
//       _id: { $ne: product._id }, // Exclude the current product
//     }).limit(4);

//     const mainCategories = await Category.find({ parent: null });
//     const cartItems = JSON.parse(req.cookies.cartItems || "[]");
//     // Store the product object in recentlyViewed cookie
//     let recentlyViewed = JSON.parse(req.cookies.recentlyViewed || "[]");
//     // Check if the product ID is already in the array, if not, add it
//     const foundProductIndex = recentlyViewed.findIndex(
//       (item) => item._id === productId
//     );
//     if (foundProductIndex === -1) {
//       let firstImage = ""; // Initialize variable to store the first image
//       // Check if the product has images and retrieve the first one
//       if (product.images && product.images.length > 0) {
//         firstImage = product.images[0];
//       }
//       recentlyViewed.push({
//         _id: product._id,
//         title: product.title,
//         basePrice: product.basePrice,
//         salePrice: product.salePrice,
//         image: firstImage, // Include the first image in the recentlyViewed object
//       });
//     }

//     // Limit the recently viewed products to a certain number, e.g., 4
//     if (recentlyViewed.length > 4) {
//       recentlyViewed = recentlyViewed.slice(recentlyViewed.length - 4);
//     }
//     const oneMonth = 30 * 24 * 60 * 60 * 1000;
//     res.cookie("recentlyViewed", JSON.stringify(recentlyViewed), {
//       maxAge: oneMonth,
//       httpOnly: false,
//       secure: false,
//     });
//     const customer = req.session.customer;

//     if (customer) {
//       try {
//         const customerDb = await User.findOne({ _id: customer._id })
//           .populate("cart.product")
//           .populate("cart.format")
//           .populate("cart.language");
//         if (!customerDb) {
//           return res.status(404).send("User not found");
//         }
//         res.render("product_detail", {
//           product,
//           mainCategories,
//           customer,
//           customerDb,
//           similarProducts,
//         });
//       } catch (error) {
//         console.error(error);
//         res.status(500).send("Internal Server Error");
//       }
//     } else {
//       // If not logged in, only render the product details without updating recentlyViewed
//       res.render("product_detail", {
//         product,
//         mainCategories,
//         customer,
//         cartItems,
//         similarProducts,
//       });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// });

router.get("/view/:id", async (req, res) => {
  const productId = req.params.id;
  try {
    const product = await Product.findOne({ _id: productId })
      .populate("formats")
      .populate("languages");

    const similarProducts = await Product.find({
      subCategory: product.subCategory,
      _id: { $ne: product._id }, // Exclude the current product
    }).limit(4);

    const mainCategories = await Category.find({ parent: null });
    const cartItems = JSON.parse(req.cookies.cartItems || "[]");
    // Store the product object in recentlyViewed cookie
    let recentlyViewed = JSON.parse(req.cookies.recentlyViewed || "[]");
    // Check if the product ID is already in the array, if not, add it
    const foundProductIndex = recentlyViewed.findIndex(
      (item) => item._id === productId
    );
    if (foundProductIndex === -1) {
      let firstImage = ""; // Initialize variable to store the first image
      // Check if the product has images and retrieve the first one
      if (product.images && product.images.length > 0) {
        firstImage = product.images[0];
      }
      recentlyViewed.push({
        _id: product._id,
        title: product.title,
        basePrice: product.basePrice,
        salePrice: product.salePrice,
        image: firstImage, // Include the first image in the recentlyViewed object
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
    let customer = null;
    if (req.session.customer) {
      customer = await User.findById(req.session.customer._id);
    }

    try {
      res.render("product_detail", {
        product,
        mainCategories,
        customer,
        similarProducts,
        cartItems,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/cart", async (req, res) => {
  try {
    let customer = null;
    if (req.session.customer) {
      customer = await User.findById(req.session.customer._id)
        .populate("cart.product")
        .populate("cart.format")
        .populate("cart.language");
    }

    const mainCategories = await Category.find({ parent: null });
    const cartItems = JSON.parse(req.cookies.cartItems || "[]");

    // Ensure customer is converted to a plain JavaScript object
    const customerData = customer ? customer.toJSON() : null;

    res.render("cart", { customerData, customer, mainCategories, cartItems });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/getSubcategories", async (req, res) => {
  const categoryId = req.query.categoryId;
  const subcategories = await Category.find({ parent: categoryId });
  res.json(subcategories);
});

router.get("/checkout", async (req, res) => {
  let customer = null;
  if (req.session.customer) {
    customer = await User.findById(req.session.customer._id)
      .populate("cart.product")
      .populate("cart.format")
      .populate("cart.language");
  }

  res.render("checkout", { customer });
});

router.get("/my-orders", async (req, res) => {
  const orderId = req.query.orderId;

  const customer = await User.findById(req.session.customer._id);
  const allOrders = await Order.find({ customer: req.session.customer._id })
    .populate("items.product")
    .populate("items.format")
    .populate("items.language");

  const mainCategories = await Category.find({ parent: null });
  if (orderId) {
    const order = await Order.findById(orderId)
      .populate("items.product")
      .populate("items.format")
      .populate("items.language")
      .populate("items");

    const similarSubCategories = order.items.map(
      (item) => item.product.subCategory
    );
    const existingProducts = order.items.map((item) => item.product._id);
    const suggestingProducts = await Product.find({
      subCategory: { $in: similarSubCategories },
      _id: { $nin: existingProducts },
    }).limit(4);

    res.render("my_orderView", {
      order,
      mainCategories,
      customer,
      suggestingProducts,
    });
  } else {
    res.render("my_orders", { allOrders, mainCategories, customer });
  }
});

router.get("/buy-now/checkout", async (req, res) => {
  try {
    let customer = null;
    if (req.session.customer) {
      customer = await User.findById(req.session.customer._id)
        .populate("cart.product")
        .populate("cart.language")
        .populate("cart.format");

      // Get the last cart item added by the user
      const lastCartItem =
        customer.cart.length > 0
          ? customer.cart[customer.cart.length - 1]
          : null;

      res.render("instant_checkout", { customer, lastCartItem });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// POST ROUTES

router.post("/add-to-cart", async (req, res, next) => {
  try {
    const customer = await User.findById(req.session.customer._id);
    const productId = req.body.productId;
    const formatId = req.body.format;
    const languageId = req.body.language;

    // Check if the cart already contains the same item
    const existingCartItemIndex = customer.cart.findIndex(
      (item) =>
        String(item.product) === String(productId) &&
        String(item.format) === String(formatId) &&
        String(item.language) === String(languageId)
    );

    if (existingCartItemIndex !== -1) {
      // If the item already exists, increment its quantity
      customer.cart[existingCartItemIndex].quantity += 1;
    } else {
      // Otherwise, create a new cart item
      customer.cart.push({
        product: productId,
        format: formatId,
        language: languageId,
        quantity: 1,
      });
    }

    await customer.save();
    const cartNumber = customer.cart.length;

    res.json({ cartNumber });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.post("/cart-increment", async (req, res) => {
  try {
    const customer = await User.findById(req.session.customer._id);

    const productId = req.body.productId;
    const formatId = req.body.formatId;
    const languageId = req.body.languageId;

    const cartItemIndex = customer.cart.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.format.toString() === formatId &&
        item.language.toString() === languageId
    );

    if (cartItemIndex !== -1) {
      customer.cart[cartItemIndex].quantity += 1;

      await customer.save();
      const latestQuantity = customer.cart[cartItemIndex].quantity;
      const cartNumber = customer.cart.length;

      res.json({ latestQuantity, cartNumber });
    } else {
      // If the cart item does not exist, send a 404 error response
      res.status(404).json({ error: "Cart item not found" });
    }
  } catch (error) {
    // If an error occurs, send a 500 error response
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/cart-decrement", async (req, res) => {
  try {
    const customer = await User.findById(req.session.customer._id);

    const productId = req.body.productId;
    const formatId = req.body.formatId;
    const languageId = req.body.languageId;

    // Find the cart item with matching productId, formatId, and languageId
    const cartItemIndex = customer.cart.findIndex(
      (item) =>
        item.product.toString() === productId &&
        item.format.toString() === formatId &&
        item.language.toString() === languageId
    );

    if (cartItemIndex !== -1) {
      // If the cart item exists, increment its quantity by 1
      customer.cart[cartItemIndex].quantity -= 1;

      // Save the updated customer document
      await customer.save();
      const latestQuantity = customer.cart[cartItemIndex].quantity;
      const cartNumber = customer.cart.length;

      // Send a success response
      res.json({ latestQuantity, cartNumber });
    } else {
      // If the cart item does not exist, send a 404 error response
      res.status(404).json({ error: "Cart item not found" });
    }
  } catch (error) {
    // If an error occurs, send a 500 error response
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/add-to-cookie", async (req, res) => {
  try {
    let cartItems = JSON.parse(req.cookies.cartItems || "[]");
    const productId = req.body.productIdCookie;
    const formatId = req.body.formatId;
    const languageId = req.body.languageId;

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
      const product = await Product.findById(productId); // Await Product.findById()
      if (!product) {
        throw new Error("Product not found");
      }
      const title = product.title;
      const price = product.salePrice.get(formatId);
      const formatDoc = await Detail.findById(formatId); // Await Detail.findById()
      if (!formatDoc) {
        throw new Error("Format not found");
      }
      const format = formatDoc.name;
      const languageDoc = await Detail.findById(languageId); // Await Detail.findById()
      if (!languageDoc) {
        throw new Error("Language not found");
      }
      const language = languageDoc.name;

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
      const oneMonth = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

      // Update the cartItems cookie with the updated cart items array and set max age
      res.cookie("cartItems", JSON.stringify(cartItems), {
        maxAge: oneMonth,
        httpOnly: false,
        secure: false,
      });
    }
    const cartNumber = cartItems.length;
    res.json({ cartNumber });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error adding item to cart" });
  }
});

router.post("/check-cart", async (req, res) => {
  const productId = req.body.productId;
  const formatId = req.body.formatId;
  const languageId = req.body.languageId;

  const product = await Product.findById(productId);
  // console.log("Retrieved Product:", product);

  const salePrice = product.salePrice.get(formatId);
  const basePrice = product.basePrice.get(formatId);
  const stock = product.stock.get(formatId).get(languageId);

  const customer = await User.findById(req.session.customer._id);

  if (customer) {
    const isCartItem = customer.cart.find(
      (item) =>
        item.product.toString() === productId &&
        item.format.toString() === formatId.toString() && // Assuming product.formats[0] holds the first format object
        item.language.toString() === languageId.toString() // Assuming product.languages[0] holds the first language object
    );

    if (isCartItem) {
      const quantity = isCartItem.quantity;
      res.json({ isCartItem, quantity, salePrice, basePrice, stock });
    } else {
      res.json({ isCartItem, salePrice, basePrice, stock });
    }
  }
});

router.post("/check-cart-cookie", async (req, res) => {
  const productId = req.body.productId;
  const formatId = req.body.formatId;
  const languageId = req.body.languageId;
  const product = await Product.findById(productId);
  const salePrice = product.salePrice.get(formatId);
  const basePrice = product.basePrice.get(formatId);
  let cartItems = JSON.parse(req.cookies.cartItems || "[]");
  const stock = product.stock.get(formatId).get(languageId);

  const isCartItem = cartItems.find(
    (item) =>
      item.productId === productId &&
      item.formatId === formatId &&
      item.languageId === languageId
  );

  if (isCartItem) {
    const quantity = isCartItem.quantity;
    res.json({ isCartItem, quantity, salePrice, basePrice, stock });
  } else {
    res.json({ isCartItem, salePrice, basePrice, stock });
  }
});

router.post("/cart-increment-cookie", async (req, res) => {
  try {
    let cartItems = JSON.parse(req.cookies.cartItems || "[]");

    const productId = req.body.productId;
    const formatId = req.body.formatId;
    const languageId = req.body.languageId;

    // Find the cart item with matching productId, formatId, and languageId
    const existingCartItemIndex = cartItems.findIndex(
      (item) =>
        item.productId === productId &&
        item.formatId === formatId &&
        item.languageId === languageId
    );

    if (existingCartItemIndex !== -1) {
      // If the item already exists, increment its quantity
      cartItems[existingCartItemIndex].quantity += 1;
      const latestQuantity = cartItems[existingCartItemIndex].quantity;

      // Update the cartItems cookie with the updated cart items array and set max age
      const oneMonth = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
      res.cookie("cartItems", JSON.stringify(cartItems), {
        maxAge: oneMonth,
        httpOnly: false,
        secure: false,
      });
      const cartNumber = cartItems.length;
      // Send a success response with the latest quantity
      res.json({ latestQuantity, cartNumber });
    } else {
      // If the cart item does not exist, send a 404 error response
      res.status(404).json({ error: "Cart item not found" });
    }
  } catch (error) {
    // If an error occurs, send a 500 error response
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/cart-decrement-cookie", async (req, res) => {
  try {
    let cartItems = JSON.parse(req.cookies.cartItems || "[]");

    const productId = req.body.productId;
    const formatId = req.body.formatId;
    const languageId = req.body.languageId;

    // Find the cart item with matching productId, formatId, and languageId
    const existingCartItemIndex = cartItems.findIndex(
      (item) =>
        item.productId === productId &&
        item.formatId === formatId &&
        item.languageId === languageId
    );

    if (
      existingCartItemIndex !== -1 &&
      cartItems[existingCartItemIndex].quantity > 1
    ) {
      // If the item already exists, decrement its quantity
      cartItems[existingCartItemIndex].quantity -= 1;
      const latestQuantity = cartItems[existingCartItemIndex].quantity;

      // Update the cartItems cookie with the updated cart items array and set max age
      const oneMonth = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
      res.cookie("cartItems", JSON.stringify(cartItems), {
        maxAge: oneMonth,
        httpOnly: false,
        secure: false,
      });
      const cartNumber = cartItems.length;

      // Send a success response with the latest quantity
      res.json({ latestQuantity, cartNumber });
    } else {
      // If the cart item does not exist, send a 404 error response
      res.status(404).json({ error: "Cart item not found" });
    }
  } catch (error) {
    // If an error occurs, send a 500 error response
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/save-address", async (req, res) => {
  const customerId = req.body.customerId;

  try {
    // Find the user by ID
    const user = await User.findById(customerId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Extract address data from request body
    const addressData = {
      name: req.body.name,
      address: req.body.address,
      locality: req.body.locality,
      district: req.body.district,
      state: req.body.state,
      country: req.body.country,
      pin: req.body.pin,
      mobile: req.body.mobile,
      alt_mobile: req.body.alt_mobile,
      nickname: req.body.nickname,
      landmark: req.body.landmark,
    };

    // Add the address to the user's address array
    user.address.push(addressData);

    // Save the updated user object
    await user.save();

    res.json({ success: true, message: "Address Added successfully" });
  } catch (error) {
    console.error("Error saving address:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// router.post("/place-order", async (req, res) => {
//   try {
//     const customerId = req.body.customerId;
//     const cartItems = JSON.parse(req.body.cartItems);
//     const totalAmount = req.body.totalAmount;
//     const addressIndex = req.body.addressIndexStore;
//     const paymentMethod = req.body.paymentMethod;

//     const customer = await User.findById(customerId);

//     const orderItems = [];
//     for (const item of cartItems) {
//       const product = await Product.findById(item.product);

//       // Check if the product exists
//       if (!product) {
//         return res.status(404).send("Product not found.");
//       }

//       // Check if salePrice map is defined
//       if (!product.salePrice) {
//         return res
//           .status(400)
//           .send("Sale price map not initialized for this product.");
//       }

//       const formatId = item.format
//         ? String(item.format._id || item.format)
//         : "";

//       // Check if salePrice map contains the specified format
//       const salePrice = product.salePrice.get(formatId);

//       // Convert salePrice to number and check if valid
//       const numericSalePrice = parseFloat(salePrice);
//       if (isNaN(numericSalePrice)) {
//         return res.status(400).send("Sale price is not a valid number.");
//       }

//       const orderItem = {
//         product: product._id,
//         quantity: item.quantity,
//         format: item.format,
//         language: item.language,
//         perOrderPrice: numericSalePrice,
//       };

//       orderItems.push(orderItem);

//       // Update totalOrders for the product
//       product.totalOrders += item.quantity;
//       await product.save();
//     }

//     const newOrder = new Order({
//       customer: customer._id,
//       items: orderItems,
//       totalAmount,
//       shippingAddress: customer.address[addressIndex],
//       paymentMethod,
//     });

//     await newOrder.save();

//     // Clear customer cart and save
//     customer.cart = [];
//       await customer.save();

//       if (paymentMethod === 'cod') {

//         res.redirect(`/my-orders?orderId=${newOrder._id}`);

//       } else if(paymentMethod==='Razor Pa') {

//       }

//   } catch (error) {
//     console.error("Error placing order:", error);
//     res.status(500).send("Internal Server Error.");
//   }
// });

router.post("/place-order", async (req, res) => {
  try {
    const {
      customerId,
      cartItems,
      totalAmount,
      addressIndexStore,
      paymentMethod,
    } = req.body;

    // Parse cart items
    const cartItemsParsed = JSON.parse(cartItems);

    // Find customer
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).send("Customer not found.");
    }

    // Process cart items and save order
    const orderItems = [];
    for (const item of cartItemsParsed) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).send("Product not found.");
      }

      const formatId = item.format
        ? String(item.format._id || item.format)
        : "";
      const salePrice = product.salePrice.get(formatId);

      if (isNaN(parseFloat(salePrice))) {
        return res.status(400).send("Sale price is not a valid number.");
      }

      // Prepare order item
      const orderItem = {
        product: product._id,
        quantity: item.quantity,
        format: item.format,
        language: item.language,
        perOrderPrice: parseFloat(salePrice),
      };

      orderItems.push(orderItem);
      product.totalOrders += item.quantity;
      await product.save();
    }

    // Razorpay order creation
    let razorpayOrder;
    if (paymentMethod === "Razor Pay") {
      const razorpayOrderOptions = {
        amount: totalAmount * 100, // Razorpay requires amount in paise
        currency: "INR",
        receipt: `order_rcptid_${Date.now()}`, // Unique receipt ID
        notes: {
          customer_id: customer._id,
          order_id: `order_${Date.now()}`, // Optional: unique order ID
        },
      };

      razorpayOrder = await razorpayInstance.orders.create(
        razorpayOrderOptions
      );

      if (!razorpayOrder) {
        return res.status(500).send("Error creating Razorpay order.");
      }
    }

    // Create and save the new order in MongoDB
    const newOrder = new Order({
      customer: customer._id,
      items: orderItems,
      totalAmount,
      shippingAddress: customer.address[addressIndexStore],
      paymentMethod,
      razorpayOrderId: razorpayOrder ? razorpayOrder.id : null, // Store Razorpay order ID if available
    });

    await newOrder.save();

    if (paymentMethod === "Razor Pay") {
      res.json({
        paymentMethod,
        orderId: newOrder._id,
        razorpayOrderId: razorpayOrder.id,
        razorpayKeyId: razorpayInstance.key_id,
        razorpayAmount: razorpayOrder.amount,
        customerName: `${customer.first_name} ${customer.last_name}`,
        customerEmail: customer.email,
        customerContact: customer.mobile,
      });
    } else {
      // Response for Cash On Delivery
      res.json({
        paymentMethod,
        orderId: newOrder._id,
      });
    }
  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).send("Internal Server Error.");
  }
});

// router.post("/razorpay-webhook", async (req, res) => {
//   try {
//     const { order_id, status, signature } = req.body; // Extract relevant fields

//     const secret = process.env.WEBHOOK_SECRET; // Your Razorpay secret key
//     const expectedSignature = crypto
//       .createHmac("sha256", secret)
//       .update(order_id + "|" + status) // or however Razorpay constructs it
//       .digest("hex");

//     if (expectedSignature !== signature) {
//       return res.status(400).send("Invalid signature");
//     }

//     const order = await Order.findOne({ razorpayOrderId: order_id });

//     if (!order) {
//       return res.status(404).send("Order not found");
//     }

//     if (status === "paid") {
//       order.paymentStatus = "paid";
//     } else if (status === "failed") {
//       order.paymentStatus = "failed";
//     }

//     await order.save();

//     res.status(200).send("Webhook processed successfully");
//   } catch (error) {
//     console.error("Error processing Razorpay webhook:", error);
//     res.status(500).send("Internal Server Error");
//   }
// });

// router.post("/razorpay-webhook", async (req, res) => {
//   const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
//     req.body;

//   const generated_signature = crypto
//     .createHmac("sha256", razorpayInstance.key_secret)
//     .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//     .digest("hex");

//   console.log("RazorPay Order Id: ", razorpay_order_id);

//   const order = await Order.findOne({ razorpayOrderId: razorpay_order_id });

//   if (!order) {
//     return res.status(404).send("Order not found.");
//   }

//   try {
//     if (generated_signature === razorpay_signature) {
//       order.paymentStatus = "paid";
//     } else {
//       order.paymentStatus = "failed";
//     }

//     await order.save(); // Ensure successful save

//     res.status(200).send("Payment verified and successful.");
//   } catch (error) {
//     console.error("Error updating payment status:", error); // Log errors during save
//     res.status(500).send("Internal Server Error."); // Inform the Razorpay server
//   }
// });

// router.post("/place-order", async (req, res) => {
//     try {
//       const { customerId, cartItems, totalAmount, addressIndexStore, paymentMethod } = req.body;
//       const cartItemsParsed = JSON.parse(cartItems);

//       const customer = await User.findById(customerId);
//       if (!customer) {
//         return res.status(404).send("Customer not found.");
//       }

//       const orderItems = [];
//       for (const item of cartItemsParsed) {
//         const product = await Product.findById(item.product);

//         if (!product) {
//           return res.status(404).send("Product not found.");
//         }

//         const formatId = item.format ? String(item.format._id || item.format) : "";
//         const salePrice = product.salePrice.get(formatId);

//         if (isNaN(parseFloat(salePrice))) {
//           return res.status(400).send("Sale price is not a valid number.");
//         }

//         const orderItem = {
//           product: product._id,
//           quantity: item.quantity,
//           format: item.format,
//           language: item.language,
//           perOrderPrice: parseFloat(salePrice),
//         };

//         orderItems.push(orderItem);
//         product.totalOrders += item.quantity;
//         await product.save();
//       }

//       const newOrder = new Order({
//         customer: customer._id,
//         items: orderItems,
//         totalAmount,
//         shippingAddress: customer.address[addressIndexStore],
//         paymentMethod,
//       });

//       await newOrder.save();

//       // Clear customer cart and save
//       customer.cart = [];
//       await customer.save();

//       // Send a JSON response for AJAX to handle
//       res.status(200).json({
//         paymentMethod,
//         orderId: newOrder._id
//       });
//     } catch (error) {
//       console.error("Error placing order:", error);
//       res.status(500).send("Internal Server Error.");
//     }
//   });

// router.post("/update-payment-success", async (req, res) => {
//   try {
//     const { orderId } = req.body; // Destructure `orderId` from the request body

//     if (!orderId) {
//       return res
//         .status(400)
//         .json({ status: false, message: "Order ID is required." });
//     }

//     // Find the order by its ID
//     const order = await Order.findById(orderId);

//     if (!order) {
//       return res
//         .status(404)
//         .json({ status: false, message: "Order not found." });
//     }

//     // Update the payment method to 'paid'
//     order.paymentStatus = "paid";
//     await order.save(); // Save the order to the database

//     // Respond with a success message
//     res.json({ status: true, message: "Payment status updated successfully." });
//   } catch (error) {
//     console.error("Error updating payment status:", error); // Log the error
//     res.status(500).json({ status: false, message: "Internal Server Error." }); // Send a 500 status code for server errors
//   }
// });

// router.post("/update-payment-failure", async (req, res) => {
//   try {
//     const { orderId } = req.body; // Destructure `orderId` from the request body

//     if (!orderId) {
//       return res
//         .status(400)
//         .json({ status: false, message: "Order ID is required." });
//     }

//     // Find the order by its ID
//     const order = await Order.findById(orderId);

//     if (!order) {
//       return res
//         .status(404)
//         .json({ status: false, message: "Order not found." });
//     }

//     // Update the payment method to 'paid'
//     order.paymentStatus = "failed";
//     await order.save(); // Save the order to the database

//     // Respond with a success message
//     res.json({ status: true, message: "Payment status updated successfully." });
//   } catch (error) {
//     console.error("Error updating payment status:", error); // Log the error
//     res.status(500).json({ status: false, message: "Internal Server Error." }); // Send a 500 status code for server errors
//   }
// });

router.post("/update-payment-status", async (req, res) => {
  const { paymentId, orderId } = req.body;


  try {
    // Fetch payment details from Razorpay
    const payment = await razorpayInstance.payments.fetch(paymentId);
    const order = await Order.findById(orderId);

      if (payment.status === "captured") {
        
          
      // Payment is valid and captured
      order.paymentStatus = "paid";
      await order.save(); // Save the order to the database
      } else {
          console.log('failure');
          
      // Payment is not captured or in an invalid state
      order.paymentStatus = "failed";
      await order.save();
    }

    res.json({
      message: "updated successfully",
    });
  } catch (error) {
    // Handle errors (e.g., network issues, invalid ID, etc.)
    res.status(500).json({
      success: false,
      message: "Error verifying payment",
      error: error.message,
    });
    }

    
    

});

router.post("/buy-now-cart", async (req, res) => {
  try {
    const customer = await User.findById(req.session.customer._id);
    const productId = req.body.productId;
    const formatId = req.body.formatId;
    const languageId = req.body.languageId;

    // Check if the cart already contains the same item
    const existingCartItemIndex = customer.cart.findIndex(
      (item) =>
        String(item.product) === String(productId) &&
        String(item.format) === String(formatId) &&
        String(item.language) === String(languageId)
    );

    if (existingCartItemIndex !== -1) {
      // If the item already exists, increment its quantity
      customer.cart[existingCartItemIndex].quantity += 1;
    } else {
      // Otherwise, create a new cart item
      customer.cart.push({
        product: productId,
        format: formatId,
        language: languageId,
        quantity: 1,
      });
    }

    await customer.save();

    res.json({ success: true, message: "Internal server error" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.post("/buy-now-cookie", async (req, res) => {
  try {
    let cartItems = JSON.parse(req.cookies.cartItems || "[]");
    const productId = req.body.productId;
    const formatId = req.body.formatId;
    const languageId = req.body.languageId;

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
      const product = await Product.findById(productId); // Await Product.findById()
      if (!product) {
        throw new Error("Product not found");
      }
      const title = product.title;
      const price = product.salePrice.get(formatId);
      const formatDoc = await Detail.findById(formatId); // Await Detail.findById()
      if (!formatDoc) {
        throw new Error("Format not found");
      }
      const format = formatDoc.name;
      const languageDoc = await Detail.findById(languageId); // Await Detail.findById()
      if (!languageDoc) {
        throw new Error("Language not found");
      }
      const language = languageDoc.name;

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
      const oneMonth = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

      // Update the cartItems cookie with the updated cart items array and set max age
      res.cookie("cartItems", JSON.stringify(cartItems), {
        maxAge: oneMonth,
        httpOnly: false,
        secure: false,
      });
    }
    res.json({ success: true, message: "Internal server error" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error adding item to cart" });
  }
});

router.post("/buy-now/place-order", async (req, res) => {
  const customerId = req.body.customerId;
  const cartItem = JSON.parse(req.body.cartItem);
  const totalAmount = req.body.totalAmount;
  const addressIndex = req.body.addressIndexStore;
  const paymentMethod = req.body.paymentMethod;

  const customer = await User.findById(customerId);

  const newOrder = new Order({
    customer: customer._id,
    items: cartItem,
    totalAmount,
    shippingAddress: customer.address[addressIndex],
    paymentMethod,
  });

  await newOrder.save();

  const product = await Product.findById(cartItem.product._id);
  product.totalOrders += cartItem.quantity;
  await product.save();

  customer.cart = [];
  await customer.save();

  res.redirect(`/my-orders?orderId=${newOrder._id}`);
});

router.post("/cancel-order", async (req, res) => {
  const orderId = req.body.order_id;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (order.status === "cancelled") {
      return res.status(400).json({ error: "Order is already cancelled" });
    }

    // Update the order status to 'cancelled' and set the cancellation timestamp
    order.status = "cancelled";
    order.cancelled_at = new Date(); // Record the cancellation timestamp
    await order.save(); // Save changes to the database

    // Send a successful response
    //   res.status(200).json({ message: "Order cancelled successfully", order });
    // Correct way to send the value of `cancelled_at`
    res.json({ cancelled_at: order.cancelled_at });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res
      .status(500)
      .json({ error: "An error occurred while cancelling the order" });
  }
});

router.get("/zoom", async (req, res) => {
  res.render("zoom");
});

module.exports = router;
