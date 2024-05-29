// IMPORTS
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const authRoute = require("./routes/auth");
const adminRoute = require("./routes/admin");
const storeRoute = require("./routes/store");
const cookieParser = require("cookie-parser");
const User = require("./models/User");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoDBStore = require("connect-mongo");
const Category = require("./models/Category");
const Product = require("./models/Product");
const Slider = require("./models/Slider");
const cors = require("cors");
const Rating = require("./models/Rating");

const app = express();
const setNoCacheHeaders = (req, res, next) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
};

app.use(setNoCacheHeaders);
app.use(bodyParser.json());
app.use(cookieParser());

// Connect to MongoDB
// Connect to MongoDB using Mongoose
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });



// Configure session middleware
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store:MongoDBStore.create({mongoUrl:process.env.MONGO_URI}),
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  })
);


// Set view engine and views directory
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));

// Parse incoming requests with JSON payloads
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Parse incoming requests with JSON payloads
app.use(express.json());
app.use(cors());

// Routes

app.get("/", async (req, res) => {
  let customer = null;
  const cartItems = JSON.parse(req.cookies.cartItems || "[]");
  const mainCategories = await Category.find({ parent: null });
  const products = await Product.find().limit(4);
  const sliders = await Slider.find({ isActive: true });
  let recentlyViewed = JSON.parse(req.cookies.recentlyViewed || "[]");

  if (req.session.customer) {
    try {
      customer = await User.findById(req.session.customer._id)
        .populate("cart.product")
        .populate("cart.format")
        .populate("cart.language");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
  if (customer) {
    res.render("index", {
      customer,
      mainCategories,
      products,
      recentlyViewed,
      sliders,
    });
  } else {
    res.render("index", {
      customer,
      mainCategories,
      products,
      cartItems,
      recentlyViewed,
      sliders,
    });
  }
});

app.use("/", storeRoute);
app.use("/account", authRoute);
app.use("/admin", adminRoute);

app.use((req, res, next) => {
  res.status(404).render("404");
});

// Start the server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
