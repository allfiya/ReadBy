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
const bodyParser = require("body-parser");
const Coupon = require("../models/Coupon");
const moment = require("moment");
const bcrypt = require("bcrypt");
const Rating = require("../models/Rating");
const cron = require("node-cron");
const multer = require("multer");

const isAuthenticated = (req, res, next) => {
  if (req.session.customer) {
    next();
  } else {
    res.redirect(req.originalUrl);
  }
};

const razorpayKey = process.env.RAZORPAY_KEY_ID;
const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Save uploaded files to the 'uploads' directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Generate a unique filename
  },
});
const upload = multer({ storage: storage });

const razorpay = new Razorpay({
  key_id: razorpayKey,
  key_secret: razorpaySecret,
});

cron.schedule("* * * * *", async () => {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const updateCondition = {
      $and: [
        {
          $or: [{ paymentStatus: "failed" }, { paymentStatus: "cancelled" }],
        },
        {
          status: { $ne: "cancelled" },
        },
        {
          createdAt: { $lt: fifteenMinutesAgo },
        },
      ],
    };

    const updateOperation = {
      $set: {
        status: "cancelled",
        paymentStatus: "cancelled",
        cancelled_at: Date.now(),
        cancelled_reason: "Automatic cancellation of Expired Payments",
        isCancelledautomatically: true,
      },
    };

    await Order.updateMany(updateCondition, updateOperation);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
});

// GET ROUTES

router.get("/library", async (req, res) => {
  try {
    // const bestSellers = await Rating.aggregate([
    //   // Group by product and calculate total ratings
    //   {
    //     $group: {
    //       _id: '$product',
    //       product: { $first: '$product' }, // Include the product id
    //       totalRatings: { $sum: '$rating' } // Sum of ratings for each product
    //     }
    //   },
    //   // Sort by total ratings in descending order
    //   {
    //     $sort: {
    //       totalRatings: -1
    //     }
    //   },
    //   // Limit to 4 results
    //   {
    //     $limit: 4
    //   }
    // ]);

    const bestSellers = await Product.find().sort({ totalOrders: -1 }).limit(4);

    const cartItems = JSON.parse(req.cookies.cartItems || "[]");
    // Initialize recentSearches in session if it doesn't exist
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

    const processedSearchQuery = searchQuery.replace(/\s+/g, " ").trim();
    let filterCriteria = [];
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
      bestSellers,
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

router.get("/view/:id", async (req, res) => {
  const productId = req.params.id;
  try {
    const product = await Product.findOne({ _id: productId })
      .populate("formats")
      .populate("languages")
      .populate("author")
      .populate("awards.award")
      .populate("mainCategory")
      .populate("subCategory")
      .populate("publisher");
    const ratings = await Rating.find({ product: productId }).populate(
      "customer"
    );

    let ratingAverageInNumber = 0;
    let ratingTotal = 0;
    if (ratings.length > 0) {
      ratings.forEach((rating) => {
        ratingTotal += rating.rating;
      });
      ratingAverageInNumber = ratingTotal / ratings.length;
    }

    const similarProducts = await Product.find({
      $or: [
        { subCategory: product.subCategory },
        { mainCategory: product.mainCategory },
      ],
      _id: { $ne: product._id }, // Exclude the current product
    })
      .limit(4)
      .populate("subCategory"); // Populate the subCategory field, assuming it's a reference

    const mainCategories = await Category.find({ parent: null });
    const cartItems = JSON.parse(req.cookies.cartItems || "[]");
    let recentlyViewed = JSON.parse(req.cookies.recentlyViewed || "[]");
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
        ratings,
        ratingAverageInNumber,
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
  const mainCategories = await Category.find({ parent: null });
  const cartItems = JSON.parse(req.cookies.cartItems || "[]");

  let customer = null;
  if (req.session.customer) {
    customer = await User.findById(req.session.customer._id)
      .populate("cart.product")
      .populate("cart.format")
      .populate("cart.language");
  }

  let cartTotal = 0;

  const productIds = new Set();
  const productSubCategories = new Set();
  const productMainCategories = new Set(); // Create a set to ensure unique IDs

  if (customer) {
    customer.cart.forEach((item) => {
      const mainCategoryId = item.product.mainCategory._id.toString(); // Convert to string for safety
      productMainCategories.add(mainCategoryId); // Add to set

      const subCategoryId = item.product.subCategory._id.toString(); // Convert to string for safety
      productSubCategories.add(subCategoryId); // Add to set

      const id = item.product._id.toString(); // Convert to string for safety
      productIds.add(id); // Add to set

      cartTotal += item.product.salePrice.get(item.format._id) * item.quantity;
    });

    const uniqueProductMainCategories = [...productMainCategories];
    const uniqueProductSubCategories = [...productSubCategories];
    const uniqueProductIds = [...productIds];
    const totalOrderAmount = cartTotal;

    const currentDate = moment().toDate(); // Get the current date

    const allCoupons = await Coupon.find({
      $and: [
        {
          $or: [
            { applicableCategories: { $in: uniqueProductMainCategories } },
            { applicableCategories: { $in: uniqueProductSubCategories } },
            { applicableProducts: { $in: uniqueProductIds } },
          ],
        },
        { minimumOrderAmount: { $lte: totalOrderAmount } }, // Ensure minimum order amount is met
        { validUntil: { $gte: currentDate } }, // Ensure the coupon is still valid
        { isActive: true }, // Ensure the coupon is active
      ],
    });

    const coupons = allCoupons.filter(
      (coupon) => coupon.usedNumber < coupon.usageLimit
    );

    res.render("checkout", { customer, coupons, mainCategories });
  } else {
    res.render("checkout", { customer, mainCategories, cartItems });
  }
});

router.get("/my-orders", isAuthenticated, async (req, res) => {
  const orderId = req.query.orderId;

  const customer = await User.findById(req.session.customer._id);
  const allOrders = await Order.find({ customer: req.session.customer._id })
    .populate("items.product")
    .populate("items.format")
    .populate("items.language")
    .sort({ createdAt: -1 });

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
    const similarMainCategories = order.items.map(
      (item) => item.product.mainCategory
    );
    const existingProducts = order.items.map((item) => item.product._id);
    const suggestingProducts = await Product.find({
      $or: [
        { subCategory: { $in: similarSubCategories } },
        { mainCategory: { $in: similarMainCategories } },
      ],
      _id: { $nin: existingProducts },
    })
      .limit(4)
      .populate("subCategory");

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
    const mainCategories = await Category.find({ parent: null });
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

      res.render("instant_checkout", {
        customer,
        lastCartItem,
        mainCategories,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/categories/:id/subcategories", async (req, res) => {
  const { id } = req.params;
  const subcategories = await Category.find({ parent: id });

  if (!subcategories) {
    return res.status(404).json({ error: "Subcategories not found" });
  }

  res.json(subcategories);
});

router.get("/get-applicable-products", async (req, res) => {
  const applicableCategories = req.query.applicableCategories;
  const products = await Product.find({
    $or: [
      { mainCategory: { $in: applicableCategories } },
      { subCategory: { $in: applicableCategories } },
    ],
  }).select("_id title"); // Select only _id and title fields

  res.json(products);
});

router.get("/get-coupons", async (req, res) => {
  try {
    // 1. Ensure the user is logged in
    if (!req.session.customer) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    // 2. Retrieve the customer's cart and all active coupons
    const customer = await User.findById(req.session.customer._id).populate(
      "cart.product"
    );
    const cartItems = customer.cart;

    let validCoupons = await Coupon.find({
      isActive: true,
      validUntil: { $gte: new Date() },
    });

    // 3. Update the coupon status based on usage limit
    const couponsToCheck = [];
    validCoupons.forEach((coupon) => {
      if (coupon.usageLimit > 0 && coupon.usedNumber >= coupon.usageLimit) {
        coupon.isActive = false;
      } else {
        couponsToCheck.push(coupon);
      }
    });

    await Coupon.bulkSave(validCoupons);

    // 4. Check each coupon against the cart items
    const applicableCoupons = [];

    couponsToCheck.forEach((coupon) => {
      cartItems.forEach((cartItem) => {
        const product = cartItem.product;
        const totalProductPrice =
          parseFloat(product.salePrice.get(cartItem.format)) *
          cartItem.quantity;

        let isApplicable = false;

        if (coupon.applicableCategories.length === 0) {
          // 5. If no specific category, check applicable products
          if (coupon.applicableProducts.includes(product._id)) {
            isApplicable = totalProductPrice >= coupon.minimumOrderAmount;
          }
        } else {
          // 6. If specific categories, check if product's main or subcategory matches
          const isCategoryApplicable = coupon.applicableCategories.some(
            (categoryId) => {
              return (
                categoryId.equals(product.mainCategory) ||
                (product.subCategory && categoryId.equals(product.subCategory))
              );
            }
          );

          if (
            isCategoryApplicable ||
            coupon.applicableProducts.includes(product._id)
          ) {
            isApplicable = totalProductPrice >= coupon.minimumOrderAmount;
          }
        }

        if (isApplicable) {
          applicableCoupons.push({
            code: coupon.code,
            description: coupon.description,
            couponType: coupon.couponType,
            couponValue: coupon.couponValue,
            maximumDiscount: coupon.maximumDiscount,
            _id: coupon._id,
          });
        }
      });
    });

    res.json({ status: "ok", coupons: applicableCoupons });
  } catch (error) {
    console.error("Error fetching applicable coupons:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

router.get("/my-wallet", async (req, res) => {
  const mainCategories = await Category.find({ parent: null });
  let customer = null;

  customer = await User.findById(req.session.customer._id).populate("wallet");

  res.render("wallet", { mainCategories, customer });
});

router.get("/get-walletAmount", async (req, res) => {
  try {
    // 1. Ensure the user is logged in
    if (!req.session.customer) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const customer = await User.findById(req.session.customer._id);

    const walletAmount = customer.wallet.totalAmount;

    res.json({ status: "ok", walletAmount });
  } catch (error) {
    console.error("Error fetching wallet Amount:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
});

router.get("/search-suggestion", async (req, res) => {
  const searchText = req.query.text; // Get the search text from query parameter

  try {
    // Perform a case-insensitive search for products that match the search text
    const products = await Product.find({
      title: { $regex: searchText, $options: "i" },
      isActive: true, // Ensure the product is active
    }).limit(5); // Limiting to 10 results for demonstration purposes

    const authors = await Registery.find({
      name: { $regex: searchText, $options: "i" },
      isActive: true, // Ensure the product is active
    }).limit(5);

    res.json({ products, authors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/recent-search", async (req, res) => {
  let recentSearches = req.session.recentSearches || [];
  res.json({ recentSearches });
});

router.post("/get-averageRating", async (req, res) => {
  const productId = req.body.productId;

  const reviews = await Rating.find({ product: productId });

  let totalRating = 0;
  let averageRating = 0;
  let averageRatingInNumber = 0;

  if (reviews.length > 0) {
    reviews.forEach((review) => {
      totalRating += review.rating;
    });

    averageRating = (totalRating / (reviews.length * 5)) * 100;
    averageRatingInNumber = totalRating / reviews.length;
  }

  res.json({ averageRating, averageRatingInNumber });
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
    const imagePath=req.body.imagePath

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
        imagePath: imagePath,
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
  const { cartItem } = req.body;
  const totalAmount = req.body.totalAmount;
  const addressIndex = req.body.addressIndexStore;
  const paymentMethod = req.body.paymentMethod;

  const cartItemParsed =
    typeof cartItem === "string" ? JSON.parse(cartItem) : cartItem;

  const customer = await User.findById(customerId);

  const product = await Product.findById(cartItemParsed.product._id);

  const formatId = cartItemParsed.format
    ? String(cartItemParsed.format._id || cartItemParsed.format)
    : "";

  const salePrice = product.salePrice.get(formatId);

  cartItemParsed.perOrderPrice = parseFloat(salePrice);

  const quantity = cartItemParsed.quantity;

  const newOrder = new Order({
    customer: customer._id,
    items: cartItemParsed,
    totalAmount,
    shippingAddress: customer.address[addressIndex],
    paymentMethod,
  });

  await newOrder.save();
  product.totalOrders += parseFloat(quantity);

  const languageId = cartItemParsed.language
    ? String(cartItemParsed.language._id || cartItemParsed.language)
    : "";
  let currentStock = product.stock.get(formatId).get(languageId);
  currentStock -= parseFloat(quantity);
  product.stock.get(formatId).set(languageId, currentStock);

  product.markModified("stock");
  await product.save();

  customer.cart.pop();
  await customer.save();

  res.json({ newOrder });
});

router.post("/cancel-cod-order", async (req, res) => {
  const orderId = req.body.order_id;
  const cancelled_reason = req.body.cancelled_reason;

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
    order.cancelled_reason = cancelled_reason;
    order.cancelled_at = new Date(); // Record the cancellation timestamp
    order.paymentStatus = "cancelled";
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

router.post("/place-order", async (req, res) => {
  try {
    const {
      customerId,
      cartItems,
      totalAmount,
      paymentMethod,
      addressIndexStore,
    } = req.body;

    let cartItemsParsed;
    try {
      cartItemsParsed =
        typeof cartItems === "string" ? JSON.parse(cartItems) : cartItems;
    } catch (err) {
      console.error("Error parsing cartItems:", err);
      return res.status(400).send("Invalid cart items.");
    }

    // Fetch customer and validate input
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).send("Customer not found.");
    }

    const orderItems = [];
    for (const item of cartItemsParsed) {
      const product = await Product.findById(item.product);

      if (!product) {
        return res.status(404).send("Product not found.");
      }

      const formatId = item.format
        ? String(item.format._id || item.format)
        : "";

      const languageId = item.language
        ? String(item.language._id || item.language)
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
      const quantity = item.quantity;
      product.totalOrders += parseFloat(quantity);

      let currentStock = product.stock.get(formatId).get(languageId);

      currentStock -= parseFloat(quantity);
      product.stock.get(formatId).set(languageId, currentStock);

      product.markModified("stock");

      await product.save();
    }
    const newOrder = new Order({
      customer: customer._id,
      items: orderItems,
      totalAmount,
      shippingAddress: customer.address[addressIndexStore],
      paymentMethod,
    });

    await newOrder.save();

    return res
      .status(201)
      .json({ message: "Order placed successfully!", newOrder });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to place order." });
  }
});

// Create Order Endpoint
router.post("/create-order", async (req, res) => {
  try {
    const {
      customerId,
      cartItems,
      totalAmount,
      paymentMethod,
      addressIndexStore,
    } = req.body;

    // Parse cart items
    let cartItemsParsed =
      typeof cartItems === "string" ? JSON.parse(cartItems) : cartItems;

    // Fetch and validate customer
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).send("Customer not found.");
    }

    // Validate and prepare order items
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

      const orderItem = {
        product: product._id,
        quantity: item.quantity,
        format: item.format,
        language: item.language,
        perOrderPrice: parseFloat(salePrice),
      };

      orderItems.push(orderItem);
    }

    // Create internal order
    const newOrder = new Order({
      customer: customer._id,
      items: orderItems,
      totalAmount,
      shippingAddress: customer.address[addressIndexStore],
      paymentMethod,
    });

    await newOrder.save();

    // Create Razorpay order
    const options = {
      amount: parseFloat(totalAmount) * 100, // in paise
      currency: "INR",
      receipt: `receipt_${newOrder._id}`,
      payment_capture: 1, // Auto-capture
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Update the internal order with Razorpay Order ID
    newOrder.razorpayOrderId = razorpayOrder.id;
    await newOrder.save();
    res.status(201).json({
      message: "Order created successfully!",
      razorpayOrder,
      orderId: newOrder._id,
      razorpayKey: razorpayKey, // This should be your public Razorpay key
      customerName: `${customer.first_name} ${customer.last_name}`,
      customerEmail: customer.email,
      customerContact: customer.mobile,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
});

router.post("/create-buyNow-order", async (req, res) => {
  try {
    const {
      customerId,
      cartItem,
      totalAmount,
      paymentMethod,
      addressIndexStore,
    } = req.body;

    // Parse cart items
    let cartItemsParsed =
      typeof cartItem === "string" ? JSON.parse(cartItem) : cartItem;

    // Fetch and validate customer
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).send("Customer not found.");
    }

    const formatId = cartItemsParsed.format
      ? String(cartItemsParsed.format._id || cartItemsParsed.format)
      : "";

    const product = await Product.findById(cartItemsParsed.product._id);
    const salePrice = product.salePrice.get(formatId);

    cartItemsParsed.perOrderPrice = parseFloat(salePrice);

    // Validate and prepare order items

    // Create internal order
    const newOrder = new Order({
      customer: customer._id,
      items: cartItemsParsed,
      totalAmount,
      shippingAddress: customer.address[addressIndexStore],
      paymentMethod,
    });

    await newOrder.save();

    const finalAmount = parseFloat((totalAmount * 100).toFixed(2));

    // Create Razorpay order
    const options = {
      amount: finalAmount, // in paise
      currency: "INR",
      receipt: `receipt_${newOrder._id}`,
      payment_capture: 1, // Auto-capture
    };

    console.log(options.amount);

    const razorpayOrder = await razorpay.orders.create(options);

    // Update the internal order with Razorpay Order ID
    newOrder.razorpayOrderId = razorpayOrder.id;
    await newOrder.save();
    res.status(201).json({
      message: "Order created successfully!",
      razorpayOrder,
      orderId: newOrder._id,
      razorpayKey: razorpayKey, // This should be your public Razorpay key
      customerName: `${customer.first_name} ${customer.last_name}`,
      customerEmail: customer.email,
      customerContact: customer.mobile,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
});

// Update Order Status Endpoint
router.post("/update-order-status", async (req, res) => {
  try {
    const { orderId, paymentStatus, razorpayPaymentId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    order.paymentStatus = paymentStatus;

    await order.save();

    res
      .status(200)
      .json({ message: `Order status updated to ${paymentStatus}` });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status." });
  }
});

router.post("/update-wallet-order-status", async (req, res) => {
  try {
    const { orderId, paymentStatus, razorpayPaymentId, walletAmount } =
      req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    order.paymentStatus = paymentStatus;

    order.fromWallet = walletAmount;

    await order.save();

    const customer = await User.findById(req.session.customer._id);

    const transactionLogCancelled = {
      transactionId: razorpayPaymentId,
      orderId: order._id,
      razorpayOrderId: order.razorpayOrderId,
      amount: walletAmount,
      transactionType: "debit",
      date: Date.now(),
      paymentStatus: "cancelled",
    };

    customer.wallet.transactionLog.push(transactionLogCancelled);
    await customer.save();

    res
      .status(200)
      .json({ message: `Order status updated to ${paymentStatus}` });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status." });
  }
});

router.post("/apply-coupon", async (req, res) => {
  const code = req.body.code;
  const total = req.body.total;
  const coupon = await Coupon.findOne({ code: code });
  if (!coupon) {
    return res.status(400).json({ error: "Coupon Not Found!" });
  }

  if (
    coupon.couponType === "percentage" &&
    coupon.couponValue > 0 &&
    coupon.couponValue <= 100
  ) {
    let reducedAmount = (coupon.couponValue * total) / 100;
    if (reducedAmount > coupon.maximumDiscount) {
      reducedAmount = coupon.maximumDiscount;
    }
    const changedTotal = total - reducedAmount;
    res.json({
      status: "ok",
      changedTotal: changedTotal,
      reducedAmount: reducedAmount,
      code: coupon.code,
    });
  } else {
    const changedTotal = total - coupon.couponValue;

    res.json({
      status: "ok",
      changedTotal: changedTotal,
      reducedAmount: coupon.couponValue,
      code: coupon.code,
    });
  }
});

router.post("/add-to-wishlist", async (req, res) => {
  const productId = req.body.productId;

  const customer = await User.findById(req.session.customer._id);

  customer.wishlist.push(productId);

  await customer.save();

  res.json({ status: "ok" });
});

router.post("/remove-from-wishlist", async (req, res) => {
  const productId = req.body.productId;

  const customer = await User.findById(req.session.customer._id);

  customer.wishlist.pop(productId);

  await customer.save();

  res.json({ status: "ok" });
});

router.post("/create-wallet", async (req, res) => {
  try {
    const { userId, amount, pin, name, razorpay_payment_id } = req.body;

    // Validate request body
    if (!userId || !amount || !pin || !name || !razorpay_payment_id) {
      return res
        .status(400)
        .json({ error: "Missing required fields in request body." });
    }

    const customer = await User.findById(userId);
    if (!customer) {
      return res.status(404).json({ error: "User not found." });
    }

    const hashedPin = await bcrypt.hash(pin, 10);

    customer.wallet = {
      totalAmount: amount,
      pin: hashedPin,
      name: name,
    };

    const transactionLog = {
      transactionId: razorpay_payment_id,
      transactionType: "credit",
      amount: amount,
      paymentStatus: "success",
      date: Date.now(),
    };

    customer.wallet.transactionLog.push(transactionLog);

    await customer.save();

    res.json({ wallet: customer.wallet });
  } catch (error) {
    console.error("Error creating wallet:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

router.post("/webhook", async (req, res) => {
  const razorpaySignature = req.headers["x-razorpay-signature"];
  const requestBody = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac("sha256", WEBHOOK_SECRET)
    .update(requestBody)
    .digest("hex");

  if (expectedSignature !== razorpaySignature) {
    return res.status(400).json({ error: "Invalid webhook signature" });
  }
  const event = req.body;

  const eventType = event.event;
  //   const refundId = event.payload.refund ? event.payload.refund.entity.id : null;

  // Check if it's a refund event
  const isRefundEvent = eventType.startsWith("refund.");
  isPayoutEvent = eventType.startsWith("payout.");

  if (isRefundEvent) {
    const orderId = event.payload.refund.entity.notes.orderId;

    const isReturnRefunding = event.payload.refund.entity.notes.returnRefunding;

    if (isReturnRefunding) {
      const order = await Order.findById(orderId);

      try {
        switch (event.event) {
          case "refund.created":
            console.log("Refund Created!");

            break;

          case "refund.processed":
            order.refundStatus = "processed";
            order.refundToAccount = true;
            order.return.status = "refunded";
            order.status = "returned";
            order.paymentStatus = "refunded";
            order.refundToAccount = true;
            order.return.refund = "success";
            await order.save();

            break;
          case "refund.failed":
            order.refundStatus = "failed";
            order.return.refund = "failed";

            await order.save();
            console.log("Refund Failed!");

            break;

          default:
            console.log(`Unhandled event type: ${event.event}`);
            break;
        }

        res.status(200).json({ success: true });
      } catch (error) {
        console.error("Error handling webhook event:", error.message);
        res.status(500).json({ error: "Failed to process webhook event." });
      }
    } else {
      const order = await Order.findById(orderId);

      try {
        switch (event.event) {
          case "refund.created":
            console.log("Refund Created!");

            break;

          case "refund.processed":
            order.paymentStatus = "refunded";
            order.refundStatus = "processed";
            order.status = "cancelled";
            order.cancelled_at = Date.now();
            order.refundToAccount = true;
            order.cancellationRequest = false;
            await order.save();

            break;
          case "refund.failed":
            order.refundStatus = "failed";
            await order.save();
            console.log("Refund Failed!");

            break;

          default:
            console.log(`Unhandled event type: ${event.event}`);
            break;
        }

        res.status(200).json({ success: true });
      } catch (error) {
        console.error("Error handling webhook event:", error.message);
        res.status(500).json({ error: "Failed to process webhook event." });
      }
    }
  } else if (isPayoutEvent) {
    const orderId = event.payload.payout.entity.notes.orderId;
    const order = await Order.findById(orderId);

    try {
      switch (event.event) {
        case "payout.processed":
          console.log("Payment Processed, Amount debit from razorpay Account");

          break;

        case "payout.completed":
          order.paymentStatus = "refunded";
          order.status = "returned";
          order.refundToAccount = true;
          order.return.refund = "success";

          await order.save();

          console.log(
            "Payment Completed, Amount credited to customers Account"
          );

          break;
        case "payout.failed":
          order.return.refund = "failed";
          console.log("Payment failed");

          break;

        default:
          console.log(`Unhandled event type: ${event.event}`);
          break;
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error handling webhook event:", error.message);
      res.status(500).json({ error: "Failed to process webhook event." });
    }
  } else {
    // Reset flags
    let isGeneral = false;
    let isAddingAmount = false;
    let isWallet = false;
    let isCreateWallet = false;

    const notes = event.payload.payment.entity.notes;
    isGeneral = Boolean(notes.general);
    isAddingAmount = Boolean(notes.addingAmount);
    isWallet = Boolean(notes.wallet);
    isCreateWallet = Boolean(notes.createWallet);

    console.log("Webhook notes:", notes);
    console.log(
      "isGeneral:",
      isGeneral,
      "isAddingAmount:",
      isAddingAmount,
      "isWallet:",
      isWallet,
      "isCreateWallet:",
      isCreateWallet
    );

    const razorpayOrderId = event.payload.payment.entity.order_id;
    const userId = event.payload.payment.entity.notes.userId;
    const pin = event.payload.payment.entity.notes.pin;
    const amount = event.payload.payment.entity.notes.amount;
    const name = event.payload.payment.entity.notes.name;
    const paymentId = event.payload.payment.entity.id;

    if (isGeneral) {
      const order = await Order.findOne({ razorpayOrderId: razorpayOrderId });

      try {
        switch (event.event) {
          case "payment.captured":
            console.log("WebHook RazorPay Id: ", razorpayOrderId);

            if (!razorpayOrderId) {
              throw new Error("Razorpay order ID not found in event payload");
            }
            order.paymentId = paymentId;
            order.paymentStatus = "paid";
            await order.save();
            console.log("Order Succesfully Updated.");

            break;

          case "payment.authorized":
            console.log("General Payment Authorized!");

            break;
          case "order.paid":
            console.log("Order Paid!");

            break;
          case "payment.failed":
            console.log("Payment Failed!");
            order.paymentStatus = "failed";
            await order.save();
            console.log("Order Succesfully Updated.");

            break;

          default:
            console.log(`Unhandled event type: ${event.event}`);
            break;
        }

        res.status(200).json({ status: "ok" });
      } catch (error) {
        console.error("Error handling webhook event:", error.message);
        res.status(500).json({ error: "Failed to process webhook event." });
      }
      isGeneral = false;
    } else if (isWallet) {
      const order = await Order.findOne({ razorpayOrderId: razorpayOrderId });

      const customer = await User.findById(userId);
      const walletAmount = event.payload.payment.entity.notes.walletAmount;

      

      const deductedAmount = parseFloat(
        parseFloat(customer.wallet.totalAmount - walletAmount).toFixed(2)
      );

      try {
        switch (event.event) {
          case "payment.captured":
            if (!razorpayOrderId) {
              throw new Error("Razorpay order ID not found in event payload");
            }
            order.paymentStatus = "paid";
            order.fromWallet = walletAmount;
            order.paymentId = paymentId;
            await order.save();
            const transactionLogCaptured = {
              transactionId: paymentId,
              orderId: order._id,
              razorpayOrderId: razorpayOrderId,
              amount: walletAmount,
              transactionType: "debit",
              date: Date.now(),
              paymentStatus: "success",
            };
            customer.wallet.totalAmount = deductedAmount;
            customer.wallet.transactionLog.push(transactionLogCaptured);
            await customer.save();
            break;

          case "payment.authorized":
            console.log("General Payment Authorized!");

            break;
          case "order.paid":
            console.log("Order Paid!");

            break;
          case "payment.failed":
            order.paymentStatus = "failed";
            order.paymentId = paymentId;
            order.fromWallet = walletAmount;
            await order.save();

            const transactionLogFailed = {
              transactionId: paymentId,
              orderId: order._id,
              razorpayOrderId: razorpayOrderId,
              amount: walletAmount,
              transactionType: "debit",
              date: Date.now(),
              paymentStatus: "failed",
            };

            customer.wallet.transactionLog.push(transactionLogFailed);
            await customer.save();

            break;

          default:
            console.log(`Unhandled event type: ${event.event}`);
            break;
        }

        res.status(200).json({ status: "ok" });
      } catch (error) {
        console.error("Error handling webhook event:", error.message);
        res.status(500).json({ error: "Failed to process webhook event." });
      }

      isWallet = false;
    } else if (isAddingAmount) {
      const customer = await User.findById(userId);
      const topupAmountString = event.payload.payment.entity.notes.topupAmount;
      const topupAmountFloat = parseFloat(
        parseFloat(topupAmountString).toFixed(2)
      );
      if (!customer) {
        return res.status(404).json({ error: "User not found." });
      }
      try {
        switch (event.event) {
          case "payment.captured":
            customer.wallet.totalAmount += topupAmountFloat;

            const transactionLog = {
              transactionId: paymentId,
              transactionType: "credit",
              amount: topupAmountFloat,
              paymentStatus: "success",
              date: Date.now(),
              transactionName: "Wallet Topup",
            };

            customer.wallet.transactionLog.push(transactionLog);
            await customer.save();

            break;
          case "payment.authorized":
            console.log("Adding Amount Payment Authorized!");

            break;

          case "order.paid":
            console.log("Order Paid!");

            break;
          case "payment.failed":
            const transactionLogFailed = {
              transactionId: paymentId,
              transactionType: "credit",
              amount: topupAmountFloat,
              paymentStatus: "failed",
              date: Date.now(),
            };

            customer.wallet.transactionLog.push(transactionLogFailed);
            await customer.save();

            break;

          default:
            console.log(`Unhandled event type: ${event.event}`);
            break;
        }

        res.status(200).json({ status: "ok" });
      } catch (error) {
        console.error("Error handling webhook event:", error.message);
        res.status(500).json({ error: "Failed to process webhook event." });
      }

      isAddingAmount = false;
    } else if (isCreateWallet) {
      try {
        switch (event.event) {
          case "payment.captured":
            const customer = await User.findById(userId);
            if (!customer) {
              return res.status(404).json({ error: "User not found." });
            }
            const hashedPin = await bcrypt.hash(pin, 10);

            customer.wallet = {
              totalAmount: amount,
              pin: hashedPin,
              name: name,
            };

            const transactionLog = {
              transactionId: paymentId,
              transactionType: "credit",
              amount: amount,
              paymentStatus: "success",
              date: Date.now(),
              transactionName: "Wallet Topup",
            };

            customer.wallet.transactionLog.push(transactionLog);
            await customer.save();

            break;
          case "payment.authorized":
            console.log("Wallet Payment Authorized!");

            break;

          case "order.paid":
            console.log("Order Paid!");

            break;
          case "payment.failed":
            console.log("payment failed");

            break;

          default:
            console.log(`Unhandled event type: ${event.event}`);
            break;
        }

        res.status(200).json({ status: "ok" });
      } catch (error) {
        console.error("Error handling webhook event:", error.message);
        res.status(500).json({ error: "Failed to process webhook event." });
      }
      isCreateWallet = false;
    } else {
      console.log(`Unhandled event type: ${event.event}`);
    }
  }
});

router.post("/delete-from-cart", async (req, res) => {
  const { itemId, itemFormat, itemLanguage } = req.body;
  const productId = new mongoose.Types.ObjectId(itemId);
  const formatId = new mongoose.Types.ObjectId(itemFormat);
  const languageId = new mongoose.Types.ObjectId(itemLanguage);

  try {
    await User.updateOne(
      {},
      {
        $pull: {
          cart: { product: productId, format: formatId, language: languageId },
        },
      }
    );
  } catch (err) {
    // Handle error
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  }

  res.json({ status: "ok" });
});


router.post("/delete-from-cookie", async (req, res) => {
  try {
    const { productId, formatId, languageId } = req.body;

    // Retrieve the cartItems cookie
    let cartItems = JSON.parse(req.cookies.cartItems || "[]");

    // Find the index of the item to be removed
    const itemIndex = cartItems.findIndex(
      (item) =>
        item.productId === productId &&
        item.formatId === formatId &&
        item.languageId === languageId
    );

    if (itemIndex !== -1) {
      // Remove the item from the array
      cartItems.splice(itemIndex, 1);

      // Update the cartItems cookie with the modified array
      const oneMonth = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
      res.cookie("cartItems", JSON.stringify(cartItems), {
        maxAge: oneMonth,
        httpOnly: false,
        secure: false,
      });
    }

    // Respond with the updated cart information
    res.json({ status: "ok"});
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error deleting item from cart" });
  }
});

router.post("/refund-to-wallet", isAuthenticated, async (req, res) => {
  const orderTotal = parseFloat(parseFloat(req.body.orderTotal).toFixed(2));
  const orderId = req.body.orderId;
  const cancelled_reason = req.body.cancelledReason;
  const userId = req.session.customer._id;

  const order = await Order.findById(orderId);

  const customer = await User.findById(userId);
  customer.wallet.totalAmount += orderTotal;

  const transactionLog = {
    amount: orderTotal,
    transactionType: "credit",
    date: Date.now(),
    paymentStatus: "success",
    transactionName: "Purchase Refund",
  };

  customer.wallet.transactionLog.push(transactionLog);

  order.status = "cancelled";
  order.paymentStatus = "refunded";
  order.cancelled_reason = cancelled_reason;
  order.cancelled_at = Date.now();
  order.refundToWallet = true;

  await customer.save();
  await order.save();

  res.json({ status: "ok", cancelled_at: order.cancelled_at });
});

router.post("/refund-to-account", isAuthenticated, async (req, res) => {
  const orderId = req.body.orderId;
  const cancelled_reason = req.body.cancelledReason;

  const order = await Order.findById(orderId);

  order.cancellationRequest = true;

  order.cancelled_reason = cancelled_reason;

  await order.save();

  res.json({ status: "ok" });
});

router.post("/refund-order", async (req, res) => {
  const { orderId } = req.body;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const paymentId = order.paymentId;
    const amountToRefund = order.totalAmount * 100; // Assuming totalAmount is in rupees, convert to paise

    const refundOptions = {
      amount: amountToRefund,
      notes: {
        returnRefunding: true,
        orderId: orderId,
      },
    };
    await razorpay.payments.refund(paymentId, refundOptions);

    const checkRefundStatus = async () => {
      const updatedOrder = await Order.findById(orderId);
      return {
        refundStatus: updatedOrder.refundStatus,
        stopPolling:
          updatedOrder.refundStatus === "processed" ||
          updatedOrder.refundStatus === "failed",
      };
    };
    const pollRefundStatus = async (interval) => {
      while (true) {
        const { refundStatus, stopPolling } = await checkRefundStatus();
        if (stopPolling) {
          return refundStatus;
        }
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    };

    const refundStatus = await pollRefundStatus(3000); // Poll every 2 seconds

    res.json({ refundStatus });
  } catch (error) {
    console.error("Error initiating refund:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/return-request", upload.array("proof", 5), async (req, res) => {
  try {
    const {
      orderId,
      returnReason,
      bankName,
      branchName,
      accountNumber,
      holderName,
      ifsc,
      contactNumber,
    } = req.body;
    const files = req.files;

    const proofs = files.map((file) => file.path);

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).send("Order not found");
    }

    const returnData = {
      reason: returnReason,
      proof: proofs,
    };
    if (order.paymentMethod === "COD" && order.paymentStatus === "paid") {
      returnData.bankAccountDetails = {
        holderName,
        accountNumber,
        bankName,
        branchName,
        ifsc,
        contactNumber,
      };
    }

    order.return = returnData;
    await order.save();

    res.status(200).send("Return request submitted successfully");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.post("/check-ifRated", async (req, res) => {
  let canRate = false;

  const { productId, selectedLanguageId, selectedFormatId } = req.body;

  const customer = req.session.customer;

  if (customer) {
    const reviewFound = await Rating.findOne({
      product: productId,
      language: selectedLanguageId,
      format: selectedFormatId,
      customer: customer._id,
    });

    const orderFound = await Order.findOne({
      customer: customer._id,
      items: {
        $elemMatch: {
          product: productId,
          format: selectedFormatId,
          language: selectedLanguageId,
        },
      },
      status: { $in: ["returned", "delivered"] },
    });

    if (!reviewFound && orderFound) {
      canRate = true;
    }
  }

  res.json({ canRate });
});

router.post(
  "/submit-review",
  upload.array("review_images", 5),
  async (req, res) => {
    const {
      longReview,
      ratedValue,
      shortReview,
      productId,
      selectedLanguageId,
      selectedFormatId,
    } = req.body;

    const files = req.files;
    const review_images = files.map((file) => file.path);
    const customer = req.session.customer;
    const newReview = new Rating({
      customer: customer._id,
      product: productId,
      format: selectedFormatId,
      language: selectedLanguageId,
      rating: ratedValue,
      shortReview,
      longReview,
      images: review_images,
    });

    await newReview.save();

    res.json({ newReview });
  }
);

router.post("/delete-recent-search", async (req, res) => {
  const { index } = req.body;

  let recentSearches = req.session.recentSearches || [];

  // Check if index is valid

  recentSearches.splice(index, 1);

  req.session.recentSearches = recentSearches;

  res.json({ recentSearches });
});

router.post("/add-to-recentSearch", async (req, res) => {
  const { searchTerm, productId } = req.body;

  let recentSearches = req.session.recentSearches || [];

  const currentDate = new Date();

  // Check if search query already exists
  let searchIndex = recentSearches.findIndex(
    (search) => search.query === searchTerm
  );

  if (searchIndex !== -1) {
    // Update the timestamp if the search query exists
    recentSearches[searchIndex].timestamp = currentDate;
  } else {
    if (productId) {
      recentSearches.push({
        query: searchTerm,
        timestamp: currentDate,
        productId: productId,
      });
    } else {
      recentSearches.push({
        query: searchTerm,
        timestamp: currentDate,
      });
    }
    // Add new search query

    // Ensure the array length does not exceed 5
    if (recentSearches.length > 5) {
      // Remove the oldest element (the first element in the array)
      recentSearches.shift();
    }
  }

  // Save the updated recent searches back to the session
  req.session.recentSearches = recentSearches;

  res.json({ success: true });
});

router.post("/fetch-order-details", async (req, res) => {
  const orderId = req.body.orderId;

  const order = await Order.findById(orderId);

  const totalAmount = order.totalAmount;
  const razorpayOrderId = order.razorpayOrderId;
  const paymentMethod = order.paymentMethod;
  const fromWallet = order.fromWallet;
  const userId = req.session.customer._id;
  res.json({
    status: "ok",
    totalAmount,
    razorpayOrderId,
    paymentMethod,
    fromWallet,
    userId,
  });
});

router.post("/create-razorpayOrder", async (req, res) => {
  const amount = req.body.amount;
  const options = {
    amount: amount * 100, // in paise
    currency: "INR",
    receipt: `receipt_Wallet_Topup`,
    payment_capture: 1, // Auto-capture
  };

  const razorpayOrder = await razorpay.orders.create(options);
  res.json({ razorpayKey, razorpayOrder });
});

router.post("/addAmount-razorpayOrder", async (req, res) => {
  const amount = req.body.amount;
  const options = {
    amount: amount * 100, // in paise
    currency: "INR",
    receipt: `receipt_Wallet_Topup_Add`,
    payment_capture: 1, // Auto-capture
  };

  const razorpayOrder = await razorpay.orders.create(options);
  res.json({ razorpayKey, razorpayOrder });
});

router.get("/fetch-razorpayKey", async (req, res) => {
  res.json({ razorpayKey });
});

// name();
module.exports = router;
