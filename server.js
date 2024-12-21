const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config()

const app = express();

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON body

// MongoDB Connection String
const mongoURI =process.env.MONGOOSE;

// Connect to MongoDB
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("[INFO] Connected to MongoDB"))
  .catch((err) => console.error("[ERROR] Failed to connect to MongoDB:", err));

// Define a Mongoose Schema and Model for Emails
const EmailSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Email validation regex
    },
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true, // Ensure username is unique
    },
  },
  { timestamps: true }
);

const EmailModel = mongoose.model("emails", EmailSchema); // Collection name: 'emails'

// Define a Mongoose Schema and Model for Contact Messages
const ContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Email validation regex
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const ContactModel = mongoose.model("contacts", ContactSchema); // Collection name: 'contacts'

// POST Endpoint to Save Email to MongoDB
app.post("/pre-register", async (req, res) => {
  console.log("[INFO] Received request to /pre-register");
  console.log("[INFO] Request body:", req.body);

  try {
    const { email, name, username } = req.body;

    // Check if all fields are provided
    if (!email || !name || !username) {
      console.warn("[WARN] Missing required fields in the request body");
      return res.status(400).json({ message: "All fields are required" });
    }

    console.log("[INFO] Data to save:", { email, name, username });
    const newEmail = new EmailModel({ email, name, username });

    // Save the data to MongoDB
    const savedEmail = await newEmail.save();
    console.log("[INFO] Email saved successfully:", savedEmail);

    res.status(201).json({
      message: "Registration saved successfully",
      data: savedEmail,
      status: "success",
    });
  } catch (error) {
    console.error("[ERROR] Error occurred while saving registration:", error);

    if (error.code === 11000) {
      const duplicateKey = Object.keys(error.keyValue)[0];
      console.warn(
        `[WARN] Duplicate ${duplicateKey} detected:`,
        error.keyValue
      );
      res
        .status(400)
        .json({ message: `${duplicateKey} already exists`, error });
    } else {
      res.status(500).json({ message: "Error saving registration", error });
    }
  }
});

// POST Endpoint to Save Contact Message to MongoDB
app.post("/contact", async (req, res) => {
  console.log("[INFO] Received request to /contact");
  console.log("[INFO] Request body:", req.body);

  try {
    const { name, email, message } = req.body;

    // Check if all fields are provided
    if (!name || !email || !message) {
      console.warn("[WARN] Missing required fields in the request body");
      return res.status(400).json({ message: "All fields are required" });
    }

    console.log("[INFO] Contact data to save:", { name, email, message });
    const newContact = new ContactModel({ name, email, message });

    // Save the message to MongoDB
    const savedContact = await newContact.save();
    console.log("[INFO] Contact message saved successfully:", savedContact);

    res.status(201).json({
      message: "Message sent successfully",
      data: savedContact,
      status: "success",
    });
  } catch (error) {
    console.error(
      "[ERROR] Error occurred while saving contact message:",
      error
    );
    res.status(500).json({ message: "Error saving message", error });
  }
});

// GET Endpoint for Admin to Retrieve All Data
app.get("/admin/data", async (req, res) => {
  console.log("[INFO] Received request to /admin/data");

  try {
    const preRegistered = await EmailModel.find({});
    const ContactMessages = await ContactModel.find({});

    console.log("[INFO] Retrieved admin data");
    res.status(200).json({
      message: "Admin data retrieved successfully",
      data: { preRegistered, ContactMessages },
      status: "success",
    });
  } catch (error) {
    console.error("[ERROR] Error occurred while retrieving admin data:", error);
    res.status(500).json({ message: "Error retrieving data", error });
  }
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error("[ERROR] Uncaught error:", err);
  res
    .status(500)
    .json({ message: "Internal Server Error", error: err.message });
});

// Server Listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[INFO] Server is running on port ${PORT}`);
});
