const mongoose = require('mongoose');
const journalSchema = require('../schema/journalSchema')
const journalModel = mongoose.model('journals', journalSchema);
module.exports = journalModel;