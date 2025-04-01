const mongoose = require('mongoose');
const habitSchema = require('../schema/habitSchema')
const habitModel = mongoose.model('habits', habitSchema);
module.exports = habitModel;