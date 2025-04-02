const mongoose = require('mongoose')

const habitSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Habit title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'custom'],
    default: 'daily'
  },
  days: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  category: {
    type: String,
    enum: ['health', 'fitness', 'productivity', 'learning', 'mindfulness','sleep','diet', 'other'],
    required: [true, 'Category is required']
  },
  streak: {
    type: Number,
    default: 0, // Current streak counter
  },
  completions: [
    {
      date: {
        type: Date,
        default: Date.now,
      },
      completed: {
        type: Boolean,
        default: true,
      },
    },
  ],
  longestStreak: {
    type: Number,
    default: 0, // Tracks the longest streak ever achieved
  },
  lastCompleted: {
    type: Date, // Tracks the last date the habit was completed
  },
  badges: [
    {
      name: {
        type: String, // e.g., "5-Day Streak", "10 Completions"
      },
      earnedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  reminder: {
    type: Boolean,
    default: false
  },
  reminderTime: {
    type: String
  },
  color: {
    type: String,
    default: '#009688'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required:true,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = habitSchema;
