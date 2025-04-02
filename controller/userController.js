// userController.js
const userModel = require("../model/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Register a new user
exports.register = async (req, res) => {
    try {
      const { username, email, password } = req.body;
      if (!username || username.length < 3) {
        return res.status(400).json({ success: false, message: "Invalid username" });
      }
      
      // Basic validation
      if (!email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "Email and password are required" 
        });
      }
      
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid email format" 
        });
      }
      
      // Password strength validation (example: at least 8 characters)
      if (password.length < 8) {
        return res.status(400).json({ 
          success: false, 
          message: "Password must be at least 8 characters long" 
        });
      }
  
      // Check if user already exists
      const existingUser = await userModel.findOne({ email, isDeleted: false });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "Email already in use" });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create new user with status
      const newUser = new userModel({
        username, // Add username to the new user object
        email,
        password: hashedPassword,
        status: 'active',
        // Additional fields could be added as needed
      });
      console.log("Request body:", req.body);

      // After creating newUser
      console.log("About to save user:", {
        id: newUser._id,
        email: newUser.email,
        hasPassword: !!newUser.password,
        passwordLength: newUser.password ? newUser.password.length : 0
      });
  
      await newUser.save();
  
      // Generate JWT token
      const token = jwt.sign(
        { userId: newUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
  
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        token,
        user: {
          id: newUser._id,
          username: newUser.username, // Include username in the response
          email: newUser.email,
          status: newUser.status
        }
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          success: false, 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      console.error("Registration error:", error);
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  };

// Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await userModel.findOne({ email, isDeleted: false });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.userId; // Set by auth middleware
    
    const user = await userModel.findById(userId).select('-password'); // Exclude password
    
    if (!user || user.isDeleted) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.userId; // Set by auth middleware
    const updates = req.body;
    
    // Don't allow password updates through this route
    delete updates.password;
    
    // Set updated_by
    updates.updated_by = userId;
    
    const user = await userModel.findByIdAndUpdate(
      userId, 
      updates, 
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.userId; // Set by auth middleware
    const { currentPassword, newPassword } = req.body;
    
    // Validate request
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Current password and new password are required" 
      });
    }
    
    // Find user
    const user = await userModel.findById(userId);
    if (!user || user.isDeleted) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }
    
    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.updated_by = userId;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Deactivate account (soft delete)
exports.deactivateAccount = async (req, res) => {
  try {
    const userId = req.userId; // Set by auth middleware
    
    const user = await userModel.findByIdAndUpdate(
      userId,
      { isDeleted: true, updated_by: userId },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    res.status(200).json({
      success: true,
      message: "Account deactivated successfully"
    });
  } catch (error) {
    console.error("Deactivate account error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};