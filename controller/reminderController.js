const reminderModel = require('../model/reminderModel')
const userModel = require('../model/userModel')
const habitModel = require('../model/habitModel')


exports.registerReminder = async (req, res) => {
    try {
      const { title, time, days, frequency } = req.body;
      if (!req.user || !req.user.id) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }
      const userId = req.user?.id || req.body.userId; // Assuming you have auth middleware that sets req.user
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated',
        });
      }
  
      // Create a new reminder
      const newReminder = new reminderModel({
        userId,
        title,
        time,
        days: days || [],
        frequency,
        enabled: true,
        createdAt: new Date()
      });
  
      // Save the reminder
      await newReminder.save();
      const message = {
        notification: {
            title: "New Reminder Set",
            body: `Your reminder "${title}" is set for ${time}`
        },
        token: user.fcmToken
    };

    admin.messaging().send(message)
            .then(response => {
                console.log("Notification sent successfully:", response);
            })
            .catch(error => {
                console.error("Error sending notification:", error);
            });
  
      return res.status(200).json({
        success: true,
        message: 'Reminder registered successfully',
        reminderId: newReminder._id
      });
    } catch (error) {
      console.error('Error registering reminder:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to register reminder',
        details: error.message
      });
    }
  };
  
  // Optional: Get user's reminders
  exports.getReminders = async (req, res) => {
    try {
      const userId = req.user.id;
      
      const reminders = await reminderModel.find({ userId });
      
      return res.status(200).json({
        success: true,
        reminders
      });
    } catch (error) {
      console.error('Error fetching reminders:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch reminders'
      });
    }
  };
  
  // Optional: Update reminder status
  exports.updateReminderStatus = async (req, res) => {
    try {
      const { reminderId, enabled } = req.body;
      const userId = req.user.id;
      
      const reminder = await reminderModel.findOne({ _id: reminderId, userId });
      
      if (!reminder) {
        return res.status(404).json({
          success: false,
          error: 'Reminder not found'
        });
      }
      
      reminder.enabled = enabled;
      await reminder.save();
      
      return res.status(200).json({
        success: true,
        message: 'Reminder updated successfully'
      });
    } catch (error) {
      console.error('Error updating reminder:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update reminder'
      });
    }
  };
  
  // Optional: Complete a habit via reminder
  exports.completeHabit = async (req, res) => {
    try {
      const { title } = req.body;
      const userId = req.user.id;
      
      // Find the habit by title (you'll need to adjust this based on your habit model)
      const habit = await habitModel.findOne({ userId, title });
      
      if (!habit) {
        return res.status(404).json({
          success: false,
          error: 'Habit not found'
        });
      }
      
      // Mark habit as complete for today
      // This depends on how you track habit completion in your model
      
      return res.status(200).json({
        success: true,
        message: 'Habit marked as complete'
      });
    } catch (error) {
      console.error('Error completing habit:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to complete habit'
      });
    }
  };

  exports.saveNotificationToken = async (req, res) => {
    try {
      const { userId, token } = req.body;
      
      // Save to your database (adjust according to your schema)
      await User.findByIdAndUpdate(userId, { 
        $set: { fcmToken: token }
      });
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error saving notification token:", error);
      res.status(500).json({ success: false, error: "Failed to save notification token" });
    }
  };