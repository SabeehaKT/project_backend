const mongoose = require('mongoose');
const profileSchema = require('../schema/profileSchema')
const profileModel = mongoose.model('profiles', profileSchema);
module.exports = profileModel;