const mongoose = require('mongoose');
const reminderSchema = require('../schema/reminderSchema');
const reminderModel = mongoose.model('reminders',reminderSchema);  // Use the imported schema
module.exports =reminderModel;