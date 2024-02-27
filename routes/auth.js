// IMPORTS

const User = require("../models/User");
const router = require("express").Router();
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

// MIDDLEWARE FUNCTIONS

const isNotAuthenticated = (req, res, next) => {
  if (!req.session.customer) {
    next();
  } else {
    res.redirect("/");
  }
};
const adminNotAuthenticated = (req, res, next) => {
  if (!req.session.admin) {
    next();
  } else {
    res.redirect("/admin/dashboard");
  }
};

const haveOTP = (req, res, next) => {
  if (req.session.otp) {
    next();
  } else {
    res.redirect("/login");
  }
};

// FUNCTIONS

const sendOTP = async (email) => {
  const otp = Math.floor(1000 + Math.random() * 9000);
  console.log(otp);

  let transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.NODEMAILER_USER,
      pass: process.env.NODEMAILER_PASS,
    },
  });

  // Send email
  let mailOptions = {
    from: "ReadBy",
    to: email,
    subject: "Your OTP for Login",
    text: `Your OTP is: ${otp}`,
  };

  // Send email
  await transporter.sendMail(mailOptions);
  return otp;
};

// GET ROUTES

router.get("/", (req, res) => {
  const customer = req.session.customer;
  res.render("index", { customer });
});

router.get("/signup", isNotAuthenticated, (req, res) => {
  res.render("signup");
});

router.get("/login", isNotAuthenticated, (req, res) => {
  res.render("login");
});

router.get("/verify/otp", isNotAuthenticated, haveOTP, (req, res) => {
  const data = req.session.signupData;
  res.render("verify_otp", { data: data });
});

router.get("/admin", adminNotAuthenticated, (req, res) => {
  res.render("admin_login");
});

// POST ROUTES

router.post("/signup", async (req, res) => {
  try {
    const { first_name, last_name, email, password1, username } = req.body;

    // Check if the email is already used
    const emailExists = await User.findOne({ email: email });
    if (emailExists) {
      return res.status(400).json({ error: "Email is already taken" });
    }
    const usernameExists = await User.findOne({ username: username });
    if (usernameExists) {
      return res.status(400).json({ error: "username is already taken" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password1, 10);

    // Example: using session for simplicity, you might want to store in the database

    // Send OTP via email
    const otp = await sendOTP(email);

    req.session.otp = {
      value: otp,
      createdAt: Date.now(), // Store current timestamp
    };
    req.session.signupData = {
      first_name: first_name,
      last_name: last_name,
      email: email,
      password: hashedPassword,
      username: username,
    };

    if (otp) {
      res.redirect("/verify/otp");
    } else {
      res.status(500).send("Error sending OTP. Please try again later.");
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/verify/otp", async (req, res) => {
  const savedOTP = req.session.otp; // Example: using session for simplicity

  const enteredOTP = parseInt(req.body.otp);

  const currentTime = Date.now();

  // Get the timestamp when the OTP was created
  const otpCreatedAt = req.session.otp.createdAt;

  // Calculate the difference between current time and OTP creation time in milliseconds
  const timeDifference = currentTime - otpCreatedAt;

  // Define the expiration time limit in milliseconds (5 minutes = 300,000 milliseconds)
  const expirationTimeLimit = 5 * 60 * 1000;

  // Verify OTP
  if (enteredOTP === savedOTP.value && timeDifference <= expirationTimeLimit) {
    delete req.session.otp;
    delete req.session.signupData;
    // Create new user
    const newUser = new User({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      password: req.body.password,
      username: req.body.username,
    });

    // Save the new user
    await newUser.save();

    res.redirect("/login");
    //
  } else {
    // Handle incorrect OTP
    res.render("verify-otp", {
      error: "Incorrect OTP. Please try again.",
      first_name: req.body.first_name, // Pass first_name and last_name back to the form
      last_name: req.body.last_name,
      email: req.body.email,
      password: req.body.password,
      username: req.body.username,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const customer = await User.findOne({
      $or: [{ username: email }, { email: email }],
    });

    // Check if user exists
    if (!customer) {
      return res.status(400).json({ error: "Invalid email or username" });
    }

    // Check if the provided password matches the hashed password
    const passwordMatch = await bcrypt.compare(password, customer.password);
    if (!passwordMatch) {
      return res.status(400).json({ error: "Incorrect password" });
    }

    if (!req.session.customer) {
      req.session.customer = customer;
    }

    // Redirect the user to the dashboard or any other page
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/logout", (req, res) => {
  // Destroy the user session
  delete req.session.customer; // Remove user data from session
  res.redirect("/login"); // Redirect the user to the login page
});

router.post("/admin", async (req, res) => {
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
    res.status(500).json({ error: "Server error" }); // Sending an error response to the client
  }
});

router.post("/admin/logout", (req, res) => {
  // Destroy the user session
  delete req.session.admin; // Remove user data from session
  res.redirect("/admin"); // Redirect the user to the login page
});

module.exports = router;
