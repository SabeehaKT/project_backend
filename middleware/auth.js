const jwt = require('jsonwebtoken');
const userModel = require('../model/userModel');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization'); // Define authHeader first
    console.log('Auth header received:', authHeader);
    
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    console.log('Token found, attempting to verify');
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token verified, decoded userId:', decoded.userId);
    
    // Find user
    const user = await userModel.findOne({ _id: decoded.userId, isDeleted: false });
    
    if (!user) {
      console.log('User not found for userId:', decoded.userId);
      return res.status(401).json({ success: false, message: 'Invalid authentication' });
    }
    
    // Add user ID to request
    console.log('User found, proceeding with request');
    req.userId = user._id;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

module.exports = auth;