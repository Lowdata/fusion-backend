const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection String
const mongoURI = process.env.MONGOOSE;

// Connect to MongoDB
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("[INFO] Connected to MongoDB"))
  .catch((err) => console.error("[ERROR] Failed to connect to MongoDB:", err));

// Define a Mongoose Schema and Model for Posts
const PostSchema = new mongoose.Schema(
  {
    mediaHash: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    links: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true } // Adds createdAt and updatedAt fields
);

const PostModel = mongoose.model("posts", PostSchema);

// POST Endpoint to Save a New Post
app.post("/posts", async (req, res) => {
  console.log("[INFO] Received request to /posts");
  console.log("[INFO] Request body:", req.body);

  try {
    const { mediaHash, body, title, links } = req.body;

    if (!mediaHash || !body || !title) {
      console.warn("[WARN] Missing required fields in the request body");
      return res
        .status(400)
        .json({ message: "mediaHash, body, and title are required" });
    }

    const newPost = new PostModel({ mediaHash, body, title, links });
    const savedPost = await newPost.save();
    console.log("[INFO] Post saved successfully:", savedPost);

    res.status(201).json({
      message: "Post saved successfully",
      data: savedPost,
      status: "success",
    });
  } catch (error) {
    console.error("[ERROR] Error occurred while saving post:", error);
    res.status(500).json({ message: "Error saving post", error });
  }
});

// GET Endpoint to Retrieve All Posts
app.get("/posts", async (req, res) => {
  console.log("[INFO] Received request to /posts");

  try {
    const posts = await PostModel.find({});
    console.log("[INFO] Retrieved posts:", posts);

    res.status(200).json({
      message: "Posts retrieved successfully",
      data: posts,
      status: "success",
    });
  } catch (error) {
    console.error("[ERROR] Error occurred while retrieving posts:", error);
    res.status(500).json({ message: "Error retrieving posts", error });
  }
});

// Admin Section
const EmailSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const EmailModel = mongoose.model("emails", EmailSchema);

const ContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const ContactModel = mongoose.model("contacts", ContactSchema);

// POST Endpoint to Save Email
app.post("/pre-register", async (req, res) => {
  console.log("[INFO] Received request to /pre-register");
  console.log("[INFO] Request body:", req.body);

  try {
    const { email, name, username } = req.body;

    if (!email || !name || !username) {
      console.warn("[WARN] Missing required fields in the request body");
      return res.status(400).json({ message: "All fields are required" });
    }

    const newEmail = new EmailModel({ email, name, username });
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
      return res
        .status(400)
        .json({ message: `${duplicateKey} already exists`, error });
    }

    res.status(500).json({ message: "Error saving registration", error });
  }
});

// POST Endpoint to Save Contact Message
app.post("/contact", async (req, res) => {
  console.log("[INFO] Received request to /contact");
  console.log("[INFO] Request body:", req.body);

  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      console.warn("[WARN] Missing required fields in the request body");
      return res.status(400).json({ message: "All fields are required" });
    }

    const newContact = new ContactModel({ name, email, message });
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
    const contactMessages = await ContactModel.find({});

    console.log("[INFO] Retrieved admin data");
    res.status(200).json({
      message: "Admin data retrieved successfully",
      data: { preRegistered, contactMessages },
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
