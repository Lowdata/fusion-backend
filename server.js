const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON body

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

const PostModel = mongoose.model("posts", PostSchema); // Collection name: 'posts'

// POST Endpoint to Save a New Post
app.post("/posts", async (req, res) => {
  console.log("[INFO] Received request to /posts");
  console.log("[INFO] Request body:", req.body);

  try {
    const { mediaHash, body, title, links } = req.body;

    // Check if all required fields are provided
    if (!mediaHash || !body || !title) {
      console.warn("[WARN] Missing required fields in the request body");
      return res
        .status(400)
        .json({ message: "mediaHash, body, and title are required" });
    }

    const newPost = new PostModel({ mediaHash, body, title, links });

    // Save the post to MongoDB
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
