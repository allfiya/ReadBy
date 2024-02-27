const router = require("express").Router();
const Detail = require("../models/Detail");
const Registery = require("../models/Registery");
const User = require("../models/User");
const Category = require("../models/Category");
const Product = require("../models/Product");
const mongoose = require("mongoose");
const multer = require("multer");

const adminAuthenticated = (req, res, next) => {
  if (req.session.admin) {
    next();
  } else {
    res.redirect("/admin");
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

router.get("/products", adminAuthenticated, async (req, res) => {
  const awards = await Detail.find({ field: "award" });
  const mainCategories = await Category.find({ parent: null });

  const formats = await Detail.find({ field: "format" });
  const languages = await Detail.find({ field: "language" });
  const products = await Product.find();
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
  const customers = await User.find({ isAdmin: false });
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

router.get("/customers", (req, res) => {
  res.render("admin_customers");
});
router.get("/categories", (req, res) => {
    res.render("admin_categories");
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
    const salePriceBack = JSON.parse(salePrice);
    const isActive = disc_active === "on";
    const selectedAuthors = JSON.parse(req.body.selectedAuthors);
    const selectedFormats = JSON.parse(req.body.selectedFormats);
    const selectedLanguages = JSON.parse(req.body.selectedLanguages);

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
      discount: {
        isActive,
        percentage,
        expiry: new Date(disc_expiry),
      },
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

    if (customer.isActive){
    customer.isActive = false; // Change this as needed
    } else {
        customer.isActive = true;
}
    // Save the updated customer
    await customer.save();

    res.redirect('/admin/customers')
});

router.post("/manage/products", async (req, res) => {
    const idInput = req.body.status_btn;
    const productId = new mongoose.Types.ObjectId(idInput);
      const product = await Product.findOne({ _id: productId });
      
      if (!product) {
          return res.status(404).json({ error: "product not found" });
      }
  
      if (product.isActive){
      product.isActive = false; // Change this as needed
      } else {
          product.isActive = true;
  }
      // Save the updated product
      await product.save();
  
      res.redirect('/admin/products')
  });

module.exports = router;
