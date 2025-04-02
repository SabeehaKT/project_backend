const mongoose = require('mongoose');

const journalSchema = new mongoose.Schema({
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    required: true, // Assuming journals are tied to users
    },
    image: {
      type: String, // Store the image path (e.g., "/uploads/filename.jpg")
      trim: true,
      default: null, // Optional field
    },
  });

  module.exports = journalSchema;