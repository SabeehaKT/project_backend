const habitModel = require('../model/habitModel')

const axios = require("axios");

const API_KEY = "AIzaSyA3f4yqBJb_Xtbpe1u0r6E1gm-VBCB6HYM"; // Replace with your actual YouTube API key
const BASE_URL = "https://www.googleapis.com/youtube/v3/search";

// Fetch YouTube videos based on habit category
exports.getVideoSuggestions = async (req, res) => {
  const { category } = req.query; // Get category from query params

  if (!category) {
    return res
      .status(400)
      .json({ success: false, error: "Category is required" });
  }

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        part: "snippet",
        q: `${category} tutorial`, // Customize search query
        type: "video",
        maxResults: 5,
        key: API_KEY,
      },
    });

    const videos = response.data.items.map((video) => ({
      title: video.snippet.title,
      description: video.snippet.description,
      videoId: video.id.videoId,
      thumbnail: video.snippet.thumbnails.high.url,
      publishedAt: video.snippet.publishedAt,
    }));

    res.json({ success: true, data: videos });
  } catch (error) {
    console.error("Error fetching YouTube videos:", error);
    res.status(500).json({ success: false, error: "Failed to fetch videos" });
  }
};

const areConsecutiveDays = (date1, date2) => {
    const d1 = new Date(date1).setHours(0, 0, 0, 0);
    const d2 = new Date(date2).setHours(0, 0, 0, 0);
    const oneDayInMs = 24 * 60 * 60 * 1000;
    return Math.abs(d1 - d2) === oneDayInMs;
  };
  
  // Helper function to award badges based on milestones
  const awardBadges = (habit) => {
    const badges = habit.badges || [];
    const streak = habit.streak;
    const totalCompletions = habit.completions.filter(c => c.completed).length;
  
    // Define badge criteria
    if (streak >= 5 && !badges.some(b => b.name === "5-Day Streak")) {
      badges.push({ name: "5-Day Streak", earnedAt: new Date() });
    }
    if (streak >= 10 && !badges.some(b => b.name === "10-Day Streak")) {
      badges.push({ name: "10-Day Streak", earnedAt: new Date() });
    }
    if (totalCompletions >= 10 && !badges.some(b => b.name === "10 Completions")) {
      badges.push({ name: "10 Completions", earnedAt: new Date() });
    }
  
    return badges;
  };

  exports.createHabit = async (req, res) => {
    try {
      const habitData = {
        ...req.body,
        userId: req.userId,
      };
  
      console.log("///////////", habitData);
      const habit = await habitModel.create(habitData);
      console.log("Body:", habit.toObject());
  
      res.status(201).json({
        success: true,
        data: habit,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  exports.getHabits = async (req, res) => {
    try {
      const habits = await habitModel.find({ userId: req.userId }).sort({ createdAt: -1 });
      res.status(200).json({
        success: true,
        data: habits,
      });
    } catch (error) {
      console.error("Error fetching habits:", error);
      res.status(500).json({
        success: false,
        error: "Server error while fetching habits",
      });
    }
  };

  exports.getHabitById = async (req, res) => {
    try {
      const habit = await habitModel.findOne({
        _id: req.params.id,
        userId: req.userId
      });
  
      if (!habit) {
        return res.status(404).json({
          success: false,
          error: "Habit not found",
        });
      }
  
      res.status(200).json({
        success: true,
        data: habit,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  exports.updateHabit = async (req, res) => {
    try {
      const habit = await habitModel.findOne({
        _id: req.params.id,
        userId: req.userId
      });
      if (!habit) {
        return res.status(404).json({
          success: false,
          error: "Habit not found",
        });
      }
  
      // Update habit fields (title, description, etc.)
      Object.assign(habit, req.body);
  
      // If the request includes a completion update
      if (req.body.completed !== undefined) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day
  
        // Check if there's already a completion entry for today
        const todayCompletion = habit.completions.find(
          (c) => new Date(c.date).setHours(0, 0, 0, 0) === today.getTime()
        );
  
        if (todayCompletion) {
          // Update existing entry
          todayCompletion.completed = req.body.completed;
          todayCompletion.date = new Date();
        } else {
          // Add new completion entry
          habit.completions.push({
            date: new Date(),
            completed: req.body.completed,
          });
        }
  
        // Update streak
        if (req.body.completed) {
          habit.lastCompleted = new Date();
          const lastCompleted = habit.lastCompleted;
  
          // Check if the last completion was yesterday
          const yesterday = new Date(today);
          yesterday.setDate(today.getDate() - 1);
  
          if (
            habit.lastCompleted &&
            areConsecutiveDays(lastCompleted, yesterday)
          ) {
            habit.streak += 1;
          } else {
            habit.streak = 1; // Reset streak if not consecutive
          }
  
          // Update longest streak
          if (habit.streak > habit.longestStreak) {
            habit.longestStreak = habit.streak;
          }
  
          // Award badges based on streak and completions
          habit.badges = awardBadges(habit);
        } else {
          // If marked as not completed, reset streak if it breaks continuity
          const lastCompleted = habit.lastCompleted;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
  
          if (
            lastCompleted &&
            new Date(lastCompleted).setHours(0, 0, 0, 0) < today.getTime()
          ) {
            habit.streak = 0;
          }
        }
      }
  
      await habit.save();
      res.status(200).json({
        success: true,
        data: habit,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  };

  exports.deleteHabit = async (req, res) => {
    try {
      const habit = await habitModel.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId  // Changed from req.user.id
      });
      
      if (!habit) {
        return res.status(404).json({
          success: false,
          error: 'Habit not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: {}
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  };

  exports.markHabitComplete = async (req, res) => {
    try {
      const { habitId, completed } = req.body;
      const userId = req.user.id; // Get from auth middleware
      const today = new Date().toISOString().split("T")[0]; // Store date without time
  
      const habit = await habitModel.findOne({ _id: habitId, userId });
  
      if (!habit) {
        return res.status(404).json({ success: false, message: "Habit not found" });
      }
  
      // Check if the habit is already logged for today
      const existingLog = habit.completionLog.find(log => 
        log.date.toISOString().split("T")[0] === today
      );
  
      if (existingLog) {
        existingLog.completed = completed; // Update status
      } else {
        habitModel.completions.push({ date: new Date(), completed });
      }
  
      await habit.save();
      res.status(200).json({ success: true, message: "Habit updated successfully!" });
    } catch (error) {
      res.status(500).json({ success: false, error: "Error marking habit completion" });
    }
  };

  exports.getHabitStats = async (req, res) => {
    try {
      const userId = req.user.id;
      const habits = await habitModel.find({ userId });
  
      const stats = habits.map(habit => {
        const totalDays = habitModel.completions.length;
        const completedDays = habitModel.completions.filter(log => log.completed).length;
        const successRate = totalDays > 0 ? ((completedDays / totalDays) * 100).toFixed(2) : 0;
  
        return {
          title: habit.title,
          totalDays,
          completedDays,
          successRate,
        };
      });
  
      res.status(200).json({ success: true, stats });
    } catch (error) {
      res.status(500).json({ success: false, error: "Error fetching habit stats" });
    }
  };