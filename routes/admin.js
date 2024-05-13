const router = require("express").Router();
const Detail = require("../models/Detail");
const Registery = require("../models/Registery");
const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");
const Slider = require("../models/Slider");
const mongoose = require("mongoose");
const multer = require("multer");
const bcrypt = require("bcrypt");
const Order = require("../models/Order");
const Coupon = require("../models/Coupon");

// Allow all origins, or configure specific allowed origins

const adminAuthenticated = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/admin");
  }
};

const adminNotAuthenticated = (req, res, next) => {
  if (!req.session.admin) {
    next();
  } else {
    res.redirect("/admin/dashboard");
  }
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Save uploaded files to the 'uploads' directory
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // Generate a unique filename
  },
});
const upload = multer({ storage: storage });

// GET REQUESTS

router.get("/dashboard", adminAuthenticated, (req, res) => {
  res.render("admin_dashboard");
});

router.get("/", adminNotAuthenticated, (req, res) => {
  res.render("admin_login");
});

router.get("/products", adminAuthenticated, async (req, res) => {
  const awards = await Detail.find({ field: "award" });
  const mainCategories = await Category.find({ parent: null });

  const formats = await Detail.find({ field: "format" });
  const languages = await Detail.find({ field: "language" });
  const products = await Product.find().sort({ createdAt: -1 });
  const authors = await Registery.find({ role: "author" });
  const publishers = await Registery.find({ role: "publisher" });

  res.render("admin_products", {
    awards,
    formats,
    languages,
    mainCategories,
    products,
    authors,
    publishers,
  });
});

router.get("/customers", adminAuthenticated, async (req, res) => {
  const customers = await User.find().sort({ createdAt: -1 });;
  res.render("admin_customers", { customers });
});

router.get("/get/subcategories", adminAuthenticated, async (req, res) => {
  try {
    const mainCategoryId = req.query.mainCategoryId;
    const subcategories = await Category.find({ parent: mainCategoryId });
    res.json(subcategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/categories", adminAuthenticated, async (req, res) => {
  const mainCategories = await Category.find({ parent: null }).populate(
    "subCategories"
    ).sort({ createdAt: -1 });;
   


  res.render("admin_categories", { mainCategories });
});

router.get("/edit/subCategory/:name",adminAuthenticated, async (req, res) => {
  const name = req.params.name;
  // Process name

  res.send(name);
});

router.get("/edit/mainCategory/:id",adminAuthenticated, async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id }).populate(
    "subCategories"
  );

  res.render("edit_mainCategory", { category });
});

router.get("/edit/product/:id",adminAuthenticated, async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id })
    .populate("author")
    .populate("formats")
    .populate("languages")
    .populate("publisher")
    .populate("mainCategory")
    .populate("subCategory")
    .populate("awards")
    .populate("awards.award");

  const awards = await Detail.find({ field: "award" });
  const mainCategories = await Category.find({ parent: null });

  const formats = await Detail.find({ field: "format" });
  const languages = await Detail.find({ field: "language" });
  const authors = await Registery.find({ role: "author" });
  const publishers = await Registery.find({ role: "publisher" });

  res.render("edit_product", {
    product,
    awards,
    mainCategories,
    formats,
    languages,
    authors,
    publishers,
  });
});

router.get("/banners", adminAuthenticated, async (req, res) => {
    const sliders = await Slider.find().sort({ createdAt: -1 });

  res.render("admin_banners", { sliders });
});

router.get("/edit/slider/:id",adminAuthenticated, async (req, res) => {
  const slider = await Slider.findOne({ _id: req.params.id });

  res.render("edit_slider", {
    slider,
  });
});

router.get("/orders",adminAuthenticated, async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });

  res.render("admin_orders", { orders });
});

router.get("/coupons",adminAuthenticated, async (req, res) => {
  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1); // Capitalize the first letter
  }
  const products = await Product.find().select("_id title");
  const mainCategories = await Category.find({ parent: null }).select(
    "_id name"
  );
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.render("admin_coupons", {
    coupons,
    mainCategories,
    capitalize,
    products,
  });
});

// POST REQUESTS

router.post("/add/product", upload.array("images", 5), async (req, res) => {
  try {
    // Extract data from the request body
    const {
      isbn,
      title,
      description,
      publisher,
      mainCategory,
      subCategory,
      awardsData,
      disc_percentage,
      disc_expiry,
      publication_date,
      disc_active,
      stockData,
      basePrice,
      salePrice,
    } = req.body;
    const awardsDataBack = JSON.parse(awardsData);
    const stockDataBack = JSON.parse(stockData);
    const basePriceBack = JSON.parse(basePrice);
    let salePriceBack = JSON.parse(salePrice);
    const isActive = disc_active === "on";
    const selectedAuthors = JSON.parse(req.body.selectedAuthors);
    const selectedFormats = JSON.parse(req.body.selectedFormats);
    const selectedLanguages = JSON.parse(req.body.selectedLanguages);

    const salePriceArray = Object.entries(salePriceBack);
    salePriceArray.sort((a, b) => a[1] - b[1]);
    salePriceBack = Object.fromEntries(salePriceArray);

    const stockDataWithObjectId = {};
    for (const formatId in stockDataBack) {
      if (Object.hasOwnProperty.call(stockDataBack, formatId)) {
        const languageStock = stockDataBack[formatId];
        const formatObjectId = new mongoose.Types.ObjectId(formatId);
        const languageStockWithObjectId = {};

        // Convert keys of the nested object to ObjectIds and values to integers
        for (const languageId in languageStock) {
          if (Object.hasOwnProperty.call(languageStock, languageId)) {
            const stock = parseInt(languageStock[languageId]);
            const languageObjectId = new mongoose.Types.ObjectId(languageId);
            languageStockWithObjectId[languageObjectId] = stock;
          }
        }

        stockDataWithObjectId[formatObjectId] = languageStockWithObjectId;
      }
    }
    const basePriceWithObjectId = {};
    for (const formatId in basePriceBack) {
      if (Object.hasOwnProperty.call(basePriceBack, formatId)) {
        basePriceWithObjectId[new mongoose.Types.ObjectId(formatId)] =
          basePriceBack[formatId];
      }
    }
    const salePriceWithObjectId = {};
    for (const formatId in salePriceBack) {
      if (Object.hasOwnProperty.call(salePriceBack, formatId)) {
        salePriceWithObjectId[new mongoose.Types.ObjectId(formatId)] =
          salePriceBack[formatId];
      }
    }

    const authorIds = selectedAuthors.map(
      (authorId) => new mongoose.Types.ObjectId(authorId)
    );
    const formatIds = selectedFormats.map(
      (formatId) => new mongoose.Types.ObjectId(formatId)
    );
    const languageIds = selectedLanguages.map(
      (languageId) => new mongoose.Types.ObjectId(languageId)
    );
    awardsDataBack.forEach((award) => {
      // Convert award.award to Mongoose ObjectId
      award.award = new mongoose.Types.ObjectId(award.award);

      award.year = String(award.year);
    });

    const publisherObjectId = new mongoose.Types.ObjectId(publisher);
    const mainCategoryObjectId = new mongoose.Types.ObjectId(mainCategory);
    const subCategoryObjectId = new mongoose.Types.ObjectId(subCategory);
    const percentage = parseInt(disc_percentage);

    // Get the paths of the uploaded images
    const images = req.files.map((file) => file.path);

    // Create a new product instance
    const newProduct = new Product({
      isbn,
      title,
      description,
      author: authorIds,
      formats: formatIds,
      languages: languageIds,
      publisher: publisherObjectId,
      mainCategory: mainCategoryObjectId,
      subCategory: subCategoryObjectId,
      awards: awardsDataBack,
      publicationDate: new Date(publication_date),
      images: images,
      stock: stockDataWithObjectId,
      basePrice: basePriceWithObjectId,
      salePrice: salePriceWithObjectId,
    });

    // Save the product to the database
    await newProduct.save();

    // Respond with success message
    res.redirect("/admin/products");
  } catch (error) {
    // Handle errors
    console.error("Error adding product:", error);
    res.status(500).send("An error occurred while adding the product");
  }
});

router.post("/manage/customers", async (req, res) => {
  const idInput = req.body.status_btn;
  const customerId = new mongoose.Types.ObjectId(idInput);
  const customer = await User.findOne({ _id: customerId });

  if (!customer) {
    return res.status(404).json({ error: "Customer not found" });
  }

  if (customer.isActive) {
    customer.isActive = false; // Change this as needed
  } else {
    customer.isActive = true;
  }
  // Save the updated customer
  await customer.save();

  res.redirect("/admin/customers");
});

router.post("/manage/products", async (req, res) => {
  const idInput = req.body.status_btn;
  const productId = new mongoose.Types.ObjectId(idInput);
  const product = await Product.findOne({ _id: productId });

  if (!product) {
    return res.status(404).json({ error: "product not found" });
  }

  if (product.isActive) {
    product.isActive = false; // Change this as needed
  } else {
    product.isActive = true;
  }
  // Save the updated product
  await product.save();

  res.redirect("/admin/products");
});

router.post("/manage/mainCategories", async (req, res) => {
  const idInput = req.body.status_btn;
  const CategoryId = new mongoose.Types.ObjectId(idInput);
  const category = await Category.findOne({ _id: CategoryId });

  if (!category) {
    return res.status(404).json({ error: "category not found" });
  }

  if (category.isActive) {
    category.isActive = false; // Change this as needed
  } else {
    category.isActive = true;
  }
  // Save the updated category
  await category.save();

  return res.redirect(req.get("referer"));
});

router.post("/add/category", async (req, res) => {
  const { name } = req.body; // Destructure the 'name' property from req.body

  const categoryExist = await Category.findOne({
    name: { $regex: new RegExp(name, "i") },
  });
  if (categoryExist) {
    return res.status(400).json({ error: "Category already exists" });
  } else {
    if (req.body.flexRadioDefault === "main_radio") {
      const subsArray = JSON.parse(req.body.subcategories);
      const newCategory = new Category({
        name: name,
        parent: null,
        subCategories: [],
      });

      await newCategory.save();

      for (const subName of subsArray) {
        // Check if a category with the name exists (case-insensitive)
        const existingCategory = await Category.findOne({
          name: { $regex: new RegExp("^" + subName + "$", "i") },
        });

        if (!existingCategory) {
          // If category doesn't exist, create a new one
          const subCategory = new Category({
            name: subName,
            parent: newCategory._id,
            subCategories: [],
          });
          await subCategory.save();

          // Add the subcategory to the parent category's subCategories array
          newCategory.subCategories.push(subCategory._id);
          await newCategory.save();
        }
      }
    } else if (req.body.flexRadioDefault === "sub_radio") {
      const { name } = req.body; // Destructure the 'name' property from req.body

      const categoryExist = await Category.findOne({
        name: { $regex: new RegExp(name, "i") },
      });
      if (categoryExist) {
        return res.status(400).json({ error: "Category already exists" });
      } else {
        const mainCategory = req.body.main_cat;
        const mainCategoryId = new mongoose.Types.ObjectId(mainCategory);
        const subCategory = new Category({
          name,
          parent: mainCategoryId,
          subCategories: [],
        });
        await subCategory.save();
      }
    }
  }

  res.redirect("/admin/categories");
});

router.post("/edit/mainCategory/:id", async (req, res) => {
  try {
    const category = await Category.findOne({ _id: req.params.id });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    const { name } = req.body;

    // Perform input validation
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Invalid category name" });
    }

    category.name = name;
    await category.save();

    // Send a success response
    return res.redirect(req.get("referer"));
  } catch (error) {
    // Handle errors
    console.error("Error editing category:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/edit/subCategory/:id", async (req, res) => {
  const input = req.params.id;
  const CategoryId = new mongoose.Types.ObjectId(input);

  const category = await Category.findOne({ _id: CategoryId });

  category.name = req.body.name;
  await category.save();
  return res.redirect(req.get("referer"));
});

router.post("/manage/subCategories/:id", async (req, res) => {
  const input = req.params.id;
  const CategoryId = new mongoose.Types.ObjectId(input);
  const category = await Category.findOne({ _id: CategoryId });

  if (!category) {
    return res.status(404).json({ error: "category not found" });
  }

  if (category.isActive) {
    category.isActive = false; // Change this as needed
  } else {
    category.isActive = true;
  }
  // Save the updated category
  await category.save();

  return res.redirect(req.get("referer"));
});

router.post("/manage/mainCategories/:id", async (req, res) => {
  const input = req.params.id;
  const CategoryId = new mongoose.Types.ObjectId(input);
  const category = await Category.findOne({ _id: CategoryId });

  if (!category) {
    return res.status(404).json({ error: "category not found" });
  }

  if (category.isActive) {
    category.isActive = false; // Change this as needed
  } else {
    category.isActive = true;
  }
  // Save the updated category
  await category.save();

  return res.redirect(req.get("referer"));
});

router.post("/edit/product/:id", async (req, res) => {
  input = req.params.id;
  const productId = new mongoose.Types.ObjectId(input);
  const product = Product.findOne({ _id: productId });
});

router.post("/", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email, isAdmin: true });

    // Check if user exists
    if (!user) {
      return res.status(400).json({ error: "Permission denied!" });
    }

    // Check if the provided password matches the hashed password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    if (!req.session.admin) {
      req.session.admin = user;
    }

    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/logout", (req, res) => {
  // Destroy the user session
  delete req.session.admin; // Remove user data from session
  res.redirect("/admin"); // Redirect the user to the login page
});

router.post("/add/slider", upload.single("image"), async (req, res) => {
  try {
    // Create a new Slider document using the data from the form
    const newSlider = new Slider({
      heading: req.body.heading,
      description: req.body.description,
      urlText: req.body.url_text,
      urlLink: req.body.url_link,
      isActive: true, // Assuming you want new sliders to be active by default
      image: req.file ? req.file.path : null, // Save the path of the uploaded image
    });

    // Save the slider to the database
    await newSlider.save();

    res.redirect("/admin/banners");
  } catch (err) {
    console.error("Error creating slider:", err);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/edit/slider", upload.single("image"), async (req, res) => {
  const sliderId = req.body.sliderId;
  const { heading, description, urlLink, urlText } = req.body;
  const status = req.body.sliderStatus;

  try {
    // Find the Slider document by ID
    const slider = await Slider.findById(sliderId);

    if (slider) {
      // Update slider properties
      slider.heading = heading;
      slider.description = description;
      slider.urlLink = urlLink;
      slider.urlText = urlText;

      if (req.file) {
        slider.image = req.file.path;
      }

      if (status === "on") {
        slider.isActive = true;
      } else {
        slider.isActive = false;
      }

      // Save the updated slider
      await slider.save();

      // Return the updated slider data in the response
      res.status(200).json({
        success: true,
        slider: {
          heading: slider.heading,
          description: slider.description,
          urlLink: slider.urlLink,
          urlText: slider.urlText,
          image: slider.image,
          // Add more fields if needed
        },
      });
    } else {
      res.status(404).json({ success: false, message: "Slider not found" });
    }
  } catch (error) {
    console.error("Error updating slider:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

router.post("/manage/sliders", async (req, res) => {
  const sliderId = req.body.sliderId;
  const isActive = req.body.isActive === "true";
  const slider = await Slider.findById(sliderId);

  if (!slider) {
    return res.status(404).json({ error: "Slider not found" });
  }

  slider.isActive = !isActive;

  // Save the updated slider
  await slider.save();

  res.json({ success: true });
});

router.post("/change-order-status", async (req, res) => {
  const orderId = req.body.orderId;
  const order = await Order.findById(orderId);
  const newStatus = req.body.selectedStatus;
  order.status = newStatus;
  await order.save();

  res.json({ newStatus });
});

router.post("/add/coupon", async (req, res) => {
  const {
    code,
    type,
    coupon_value,
    expiry,
    limit,
    min_order,
    max_disc,
    description,
    applicable_categories,
    applicable_products,
  } = req.body;

  const applicableCategories = JSON.parse(applicable_categories);
  const applicableProducts = JSON.parse(applicable_products);

  const categoryIds = applicableCategories.map(
    (categoryId) => new mongoose.Types.ObjectId(categoryId)
  );

  const productIds = applicableProducts.map(
    (productId) => new mongoose.Types.ObjectId(productId)
  );

  try {
    // Create a new Slider document using the data from the form
    const newCoupon = new Coupon({
      code,
      description,
      couponType: type,
      couponValue: coupon_value,
      validUntil: expiry, // Assuming you want new sliders to be active by default
      usageLimit: limit,
      applicableProducts: productIds,
      applicableCategories: categoryIds,
      minimumOrderAmount: min_order,
      maximumDiscount: max_disc,
      isActive: true,
    });

    // Save the slider to the database
    await newCoupon.save();

    res.redirect("/admin/coupons");
  } catch (err) {
    console.error("Error creating Coupon:", err);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/update-coupon-status", async (req, res) => {
  try {
    const { couponId } = req.body;

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ error: "Coupon not found." });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    return res.status(200).json({ activeStatus: coupon.isActive });
  } catch (error) {
    console.error("Error updating coupon status:", error);
    return res.status(500).json({ error: "Failed to update coupon status." });
  }
});

// MOBILE OTP INTEGRATION

// const accountSid = process.env.TWILIO_SID;
// const authToken = process.env.TWILIO_TOKEN;
// const client = twilio(accountSid, authToken);

// router.post("/admin", async (req, res) => {
//   const mobile = req.body.mobile;

//   const user = await User.findOne({ mobile: mobile });

//   if (!user) {
//     res.status(500).send("No user with the entered mobile number exists");
//   }

//   const otp = Math.floor(100000 + Math.random() * 900000);

//   req.session.otp = otp;
//   req.session.mobile = mobile;

//   try {
//     await client.messages.create({
//       body: `Your OTP code is: ${otp}`,
//       from: process.env.TWILIO_FROM_NUMBER,
//       to: mobile.startsWith("+") ? mobile : `+${mobile}`,
//     });

//     res.redirect("/admin/enter-otp");
//   } catch (error) {
//     console.error("Error sending OTP:", error.message);
//     res.status(500).send("Error sending OTP. Please try again later.");
//   }
// });

// router.post("/admin/validate-otp", async (req, res) => {
//   const submittedOtp = parseInt(req.body.otp, 10);
//   const storedOtp = req.session.otp;

//   if (submittedOtp === storedOtp) {
//     const user = await User.findOne({ mobile: req.session.mobile });
//     req.session.admin = user;
//     res.redirect("/admin/dashboard");
//   } else {
//     res.status(401).send("Invalid OTP. Please try again.");
//   }
// });

module.exports = router;
