const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      // required : true
    },
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      //  required : true
    },
    isDeleted: { type: Boolean, default: false }, // Soft delete field
  },
  {
    timestamps: true,
  }
);

module.exports = userSchema;
