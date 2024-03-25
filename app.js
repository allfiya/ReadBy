// IMPORTS
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const authRoute = require("./routes/auth");
const adminRoute = require("./routes/admin");
const storeRoute = require("./routes/store");
const cookieParser = require("cookie-parser");
const User=require('./models/User')
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const Category = require("./models/Category");
const Product = require("./models/Product");
const Slider=require('./models/Slider')

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
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("DB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Create MongoDB session store
const store = new MongoDBStore({
  uri: process.env.MONGODB_URI,
  collection: "sessions",
});

// Catch errors in MongoDB session store
store.on("error", function (error) {
  console.error("MongoDB session store error:", error);
});

// Configure session middleware
app.use(
  session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    store: store,
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

// app.get("/", async (req, res) => {
//   const customer = req.session.customer;
//   const cartItems = JSON.parse(req.cookies.cartItems || "[]");
//   mainCategories = await Category.find({ parent: null });
//   const products = await Product.find().limit(4);
//   if (customer) {
//     try {
//       const customerDb = await User.findOne({ _id: customer._id })
//         .populate("cart.product")
//         .populate("cart.format")
//         .populate("cart.language");

//       if (!customerDb) {
//          res.status(404).send("User not found");
//       }

//       res.render("index", { customer, mainCategories, customerDb, products });
//     } catch (error) {
//       console.error(error);
//       res.status(500).send("Internal Server Error");
//     }
//   } else {
//     res.render("index", { customer, mainCategories, products, cartItems });
//   }
// });

// Routes

app.get("/", async (req, res) => {
    const customer = req.session.customer;
    const cartItems = JSON.parse(req.cookies.cartItems || "[]");
    const mainCategories = await Category.find({ parent: null });
    const products = await Product.find().limit(4);
    const sliders = await Slider.find({ isActive: true });
    let recentlyViewed = JSON.parse(req.cookies.recentlyViewed || "[]");
  
    if (customer) {
      try {
        const customerDb = await User.findOne({ _id: customer._id })
          .populate("cart.product")
          .populate("cart.format")
          .populate("cart.language");
  
        if (!customerDb) {
           res.status(404).send("User not found");
        }
  
        res.render("index", { customer, mainCategories, customerDb, products, recentlyViewed,sliders });
      } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
      }
    } else {
      res.render("index", { customer, mainCategories, products, cartItems, recentlyViewed,sliders });
    }
  });
  

app.use("/", storeRoute);
app.use("/account", authRoute);
app.use("/admin", adminRoute);

app.use((req, res, next) => {
  res.status(404).render("404");
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
