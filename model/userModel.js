const mongoose = require('mongoose');
const userSchema = require('../schema/userSchema');
const userModel = mongoose.model('users',userSchema);  // Use the imported schema
module.exports =userModel;