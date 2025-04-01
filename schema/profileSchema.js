const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  name: { 
    type: String,
     required: true 
    },
  email: { 
    type: String, 
    required: true, 
    unique: true 
},
  password: { 
    type: String, 
    required: true
 }, // Hashed password for security
  joinDate: { 
    type: Date, 
    default: Date.now 
},
  profileImage: {
     type: String,
      default: "" 
    }, // URL of profile image
  goalStatement: {
     type: String,
      default: "" 
    },
  notificationsEnabled: { 
    type: Boolean,
     default: true
     },
  emailUpdates: { 
    type: Boolean,
     default: false
     },
  weeklyReports: { 
    type: Boolean,
     default: true
     },
  darkMode: { type: Boolean, default: false },
});

module.exports = profileSchema;
