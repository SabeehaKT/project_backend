const habitModel = require('../model/habitModel')
const User = require('../model/userModel');
const { Server } = require("socket.io");
console.log('Attempting to require agendaConfig');
const { agenda } = require('../agendaConfig');
const axios = require("axios");
const { default: mongoose } = require('mongoose');

const HF_API_KEY = "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"; // Your Hugging Face token
const HF_API_URL = "https://api-inference.huggingface.co/models/google/flan-t5-small";// Model for text generation
const API_KEY = "AIzaSyA3f4yqBJb_Xtbpe1u0r6E1gm-VBCB6HYM"; 
const BASE_URL = "https://www.googleapis.com/youtube/v3/search";

async function generateSearchQuery(habit) {
  const inputText = `generate query: Short YouTube search for ${habit.title} ${habit.description || ""}`;

  try {
    const response = await axios.post(
      HF_API_URL,
      { inputs: inputText },
      {
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Full Hugging Face response:", response.data); // Log entire response
    const query = response.data[0]?.translation_text || response.data[0]?.generated_text || "";
    console.log("Extracted query:", query); // Log extracted query
    return query.trim().length > 0 ? query.trim() : `${habit.category} tutorial`;
  } catch (error) {
    console.error("Hugging Face error details:", error.response?.data || error.message);
    return `${habit.category} tutorial`; // Fallback
  }
}

// Fetch YouTube videos
exports.getVideoSuggestions = async (req, res) => {
  const { category } = req.query;

  if (!category) {
    return res
      .status(400)
      .json({ success: false, error: "Category is required" });
  }

  try {
    // Fetch habit from database
    const habit = await habitModel.findOne({ category, userId: req.userId });
    if (!habit) {
      return res
        .status(404)
        .json({ success: false, error: "Habit not found" });
    }

    // Generate AI query
    const searchQuery = await generateSearchQuery(habit);
    console.log("Generated query for habit:", habit.title, "->", searchQuery);

    // Fetch YouTube videos with AI query
    const response = await axios.get(BASE_URL, {
      params: {
        part: "snippet",
        q: searchQuery,
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

    res.json({ success: true, data: videos, query: searchQuery }); // Return query for verification
  } catch (error) {
    console.error("Error fetching YouTube videos:", error.message);
    res.status(500).json({ success: false, error: "Failed to fetch videos" });
  }
};

const areConsecutiveDays = (date1, date2) => {
    const d1 = new Date(date1).setHours(0, 0, 0, 0);
    const d2 = new Date(date2).setHours(0, 0, 0, 0);
    const oneDayInMs = 24 * 60 * 60 * 1000;
    return Math.abs(d1 - d2) === oneDayInMs;
  };

  // Helper to check if the streak should be reset due to missed days
const hasMissedDay = (habit, today) => {
  if (!habit.lastCompleted) return true; // No previous completion, streak should be 0
  const lastCompleted = new Date(habit.lastCompleted).setHours(0, 0, 0, 0);
  const todayTime = today.setHours(0, 0, 0, 0);
  const oneDayInMs = 24 * 60 * 60 * 1000;
  return todayTime - lastCompleted > oneDayInMs; // Missed at least one day
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

  const scheduleReminder = async (userId, habitName, reminderTime, frequency, days) => {
    console.log('Entering scheduleReminder with:', { userId, habitName, reminderTime, frequency, days });
  if (!agenda) {
    console.error('Agenda is undefined in scheduleReminder');
    throw new Error('Agenda is not initialized');
  }

    const [hours, minutes] = reminderTime.split(":");
    const now = new Date();
    let reminderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
  
    if (reminderDate < now) {
      reminderDate.setDate(reminderDate.getDate() + 1); // Schedule for tomorrow if time has passed
    }
  
    if (frequency === "daily") {
      await agenda.every("1 day", "send habit reminder", {
        userId,
        habitName,
      });
    } else if (frequency === "weekly" || frequency === "custom") {
      for (const day of days) {
        const dayIndex = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].indexOf(day);
        await agenda.every(`${dayIndex} * * *`, "send habit reminder", {
          userId,
          habitName,
        }); // Cron format: "dayOfWeek * * *"
      }
    } else {
      await agenda.schedule(reminderDate, "send habit reminder", {
        userId,
        habitName,
      });
    }
  };

  exports.createHabit = async (req, res) => {
    try {
      const habitData = {
        ...req.body,
        userId: req.userId,
      };
  
      const habit = await habitModel.create(habitData);
  
      // Schedule reminder if enabled
      if (habitData.reminder) {
        await scheduleReminder(
          req.userId,
          habitData.title,
          habitData.reminderTime,
          habitData.frequency,
          habitData.days || []
        );
      }
  
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

  exports.registerReminder = async (req, res) => {
    try {
      const { title, time, days, frequency, userId } = req.body;
  
      await scheduleReminder(userId, title, time, frequency, days);
  
      res.status(200).json({
        success: true,
        message: "Reminder registered successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Failed to register reminder",
      });
    }
  };

  exports.getHabits = async (req, res) => {
    try {
      const habits = await habitModel.find({ userId: req.userId }).sort({ createdAt: -1 });
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check each habit for missed days and update streak
    for (let habit of habits) {
      if (hasMissedDay(habit, today)) {
        habit.streak = 0;
        await habit.save();
      }
    }
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
        let todayCompletion = habit.completions.find(
          (c) => new Date(c.date).setHours(0, 0, 0, 0) === today.getTime()
        );
  
        if (req.body.completed) {
          // Mark as completed
          if (todayCompletion) {
            todayCompletion.completed = true;
            todayCompletion.date = new Date();
          } else {
            todayCompletion = { date: new Date(), completed: true };
            habit.completions.push(todayCompletion);
          }
  
          // Update lastCompleted
          habit.lastCompleted = new Date();
  
          // Check for streak continuity
          if (hasMissedDay(habit, today)) {
            habit.streak = 1; // Reset streak if a day was missed
          } else {
            // Check if the previous completion was yesterday
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            if (
              habit.lastCompleted &&
              areConsecutiveDays(habit.lastCompleted, yesterday)
            ) {
              habit.streak = (habit.streak || 0) + 1; // Increment streak
            } else {
              habit.streak = 1; // Start new streak
            }
          }
  
          // Update longest streak
          if (habit.streak > (habit.longestStreak || 0)) {
            habit.longestStreak = habit.streak;
          }
  
          // Award badges
          habit.badges = awardBadges(habit);
        } else {
          // Mark as incomplete
          if (todayCompletion) {
            todayCompletion.completed = false;
            todayCompletion.date = new Date();
          } else {
            todayCompletion = { date: new Date(), completed: false };
            habit.completions.push(todayCompletion);
          }
  
          // Reset streak if a day was missed or marked incomplete
          if (habit.lastCompleted && hasMissedDay(habit, today)) {
            habit.streak = 0;
          } else {
            habit.streak = 0; // Reset streak for incomplete day
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

  const getTodayRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    return { today, tomorrow };
  };
  
  exports.getHabitStats = async (req, res) => {
    try {
      const userId = req.userId;
      console.log('User ID from request for getting habit stats:', userId);
  
      const { today, tomorrow } = getTodayRange();
      const stats = await habitModel.aggregate([
        { $match: { userId:  new mongoose.Types.ObjectId(userId) } },
        {
          $group: {
            _id: null,
            highestStreak: { $max: '$longestStreak' },
            totalHabits: { $sum: 1 },
            todayHabits: {
              $sum: {
                $cond: [
                  {
                    $reduce: {
                      input: '$completions',
                      initialValue: false,
                      in: {
                        $or: [
                          '$$value',
                          {
                            $and: [
                              { $gte: ['$$this.date', today] },
                              { $lt: ['$$this.date', tomorrow] },
                              { $eq: ['$$this.completed', true] },
                            ],
                          },
                        ],
                      },
                    },
                  },
                  1,
                  0,
                ],
              },
            },
            completedHabits: {
              $sum: {
                $size: {
                  $filter: {
                    input: '$completions',
                    as: 'completion',
                    cond: { $eq: ['$$completion.completed', true] },
                  },
                },
              },
            },
            completionRate: {
              $avg: {
                $cond: [
                  { $gt: [{ $size: '$completions' }, 0] },
                  {
                    $divide: [
                      {
                        $size: {
                          $filter: {
                            input: '$completions',
                            as: 'completion',
                            cond: { $eq: ['$$completion.completed', true] },
                          },
                        },
                      },
                      { $size: '$completions' },
                    ],
                  },
                  0,
                ],
              },
            },
            recentAchievement: { $max: '$badges.name' },
          },
        },
        {
          $project: {
            streak: '$highestStreak',
            completionRate: { $multiply: ['$completionRate', 100] },
            todayHabits: 1,
            totalHabits: 1,
            completedHabits: 1,
            recentAchievement: 1,
          },
        },
      ]);
  
      const user = await User.findById(userId);
      const response = stats.length > 0
        ? { ...stats[0], lastLogin: user.lastLogin || new Date().toISOString() }
        : {
            lastLogin: user.lastLogin || new Date().toISOString(),
            streak: 0,
            completionRate: 0,
            todayHabits: 0,
            totalHabits: 0,
            completedHabits: 0,
            recentAchievement: 'None',
          };
  
      res.status(200).json({ success: true, stats: response });
    } catch (error) {
      console.error('Error fetching habit stats:', error);
      res.status(500).json({ success: false, error: 'Error fetching habit stats' });
    }
  };

  exports.getUserRecentActivity = async (req, res) => {
    try {
      const userId = req.userId;
      
      // Get current date and date 14 days ago
      const today = new Date();
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      
      // Find all habit completions in the last 14 days
      const habitCompletions = await habitModel.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId)
          }
        },
        {
          $unwind: "$completions"
        },
        {
          $match: {
            "completions.date": { $gte: twoWeeksAgo, $lte: today },
            "completions.completed": true
          }
        },
        {
          $sort: { "completions.date": -1 }
        },
        {
          $limit: 10 // Get the 10 most recent completions
        },
        {
          $project: {
            habitId: "$_id",
            habitName: "$title",
            date: "$completions.date",
            type: "completion"
          }
        }
      ]);
      
      // Find streak achievements from the last 14 days
      const streakAchievements = await habitModel.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            streakUpdates: { 
              $elemMatch: { 
                date: { $gte: twoWeeksAgo, $lte: today },
                milestone: true
              }
            }
          }
        },
        {
          $unwind: "$streakUpdates"
        },
        {
          $match: {
            "streakUpdates.date": { $gte: twoWeeksAgo, $lte: today },
            "streakUpdates.milestone": true
          }
        },
        {
          $sort: { "streakUpdates.date": -1 }
        },
        {
          $project: {
            habitId: "$_id",
            habitName: "$name",
            date: "$streakUpdates.date",
            streakCount: "$streakUpdates.count",
            type: "streak"
          }
        }
      ]);
      
      // Find recently added habits
      const newHabits = await habitModel.find({
        userId: userId,
        createdAt: { $gte: twoWeeksAgo, $lte: today }
      })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id name createdAt')
      .lean()
      .then(habits => habits.map(habit => ({
        habitId: habit._id,
        habitName: habit.name,
        date: habit.createdAt,
        type: "new"
      })));
      
      // Find badge achievements
      const badgeAchievements = await habitModel.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            "badges.dateEarned": { $gte: twoWeeksAgo, $lte: today }
          }
        },
        {
          $unwind: "$badges"
        },
        {
          $match: {
            "badges.dateEarned": { $gte: twoWeeksAgo, $lte: today }
          }
        },
        {
          $sort: { "badges.dateEarned": -1 }
        },
        {
          $project: {
            habitId: "$_id",
            habitName: "$name",
            date: "$badges.dateEarned",
            badgeName: "$badges.name",
            type: "badge"
          }
        }
      ]);
      
      // Combine all activities and sort by date
      const allActivities = [
        ...habitCompletions,
        ...streakAchievements,
        ...newHabits,
        ...badgeAchievements
      ].sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 15); // Return only the 15 most recent activities
      
      res.status(200).json({
        success: true,
        activities: allActivities
      });
      
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      res.status(500).json({ 
        success: false, 
        error: "Error fetching recent activities" 
      });
    }
  };