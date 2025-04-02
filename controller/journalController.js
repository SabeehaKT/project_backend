const journalModel = require('../model/journalModel')

exports.getJournals = async (req, res) => {
    try {
      const journals = await journalModel.find({ userId: req.userId }).sort({ date: -1 });
      res.status(200).json({
        success: true,
        data: journals,
      });
    } catch (error) {
      console.error("Error fetching journals:", error);
      res.status(500).json({
        success: false,
        error: "Server error while fetching journals",
      });
    }
  };

  exports.addJournal = async (req, res) => {
    try {
      const { title, content, date } = req.body;
      const image = req.file ? `/uploads/${req.file.filename}` : null; // Save image path
  
      console.log("Uploaded file:", req.file); // Debug: Check multer output
      console.log("Image path:", image); // Debug: Check the path
  
      if (!title || !content) {
        return res.status(400).json({
          success: false,
          error: "Title and content are required",
        });
      }
  
      const journal = new journalModel({
        title,
        content,
        image, // This will now be saved
        date: date || Date.now(),
        userId: req.userId,
      });
  
      await journal.save();
      console.log("Saved journal:", journal); // Debug: Check the saved document
  
      res.status(201).json({
        success: true,
        data: journal,
        message: "Journal entry created successfully",
      });
    } catch (error) {
      console.error("Error adding journal:", error);
      res.status(500).json({
        success: false,
        error: "Server error while adding journal",
      });
    }
  };

  exports.updateJournal = async (req, res) => {
    try {
      const { id } = req.params; // Ensure this matches your route
      const { title, content, imagePath } = req.body; // Add imagePath to keep existing image
      const journal = await journalModel.findOne({
        _id: id,
        userId: req.userId,
      });
  
      if (!journal) {
        return res.status(404).json({
          success: false,
          error: "Journal entry not found",
        });
      }
  
      journal.title = title || journal.title;
      journal.content = content || journal.content;
      if (req.file) {
        journal.image = `/uploads/${req.file.filename}`; // Update with new image
      } else if (imagePath) {
        journal.image = imagePath; // Keep existing image if provided
      }
  
      await journal.save();
      res.status(200).json({
        success: true,
        data: {
          _id: journal._id,
          title: journal.title,
          content: journal.content,
          date: journal.date,
          userId: journal.userId,
          image: journal.image || null,
        },
        message: "Journal entry updated successfully",
      });
    } catch (error) {
      console.error("Error updating journal:", error);
      res.status(500).json({
        success: false,
        error: "Server error while updating journal",
      });
    }
  };

  exports.deleteJournal = async (req, res) => {
    try {
      const { id } = req.params;
  
      const journal = await journalModel.findOneAndDelete({
        _id: id,
        userId: req.userId
      });
      if (!journal) {
        return res.status(404).json({
          success: false,
          error: "Journal entry not found",
        });
      }
  
      res.status(200).json({
        success: true,
        message: "Journal entry deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting journal:", error);
      res.status(500).json({
        success: false,
        error: "Server error while deleting journal",
      });
    }
  };

  exports.getJournalById = async (req, res) => {
    try {
      const { id } = req.params;
      const journal = await journalModel.findOne({
        _id: id,
        userId: req.userId,
      });
      if (!journal) {
        return res.status(404).json({
          success: false,
          error: "Journal entry not found",
        });
      }
      res.status(200).json({
        success: true,
        data: {
          _id: journal._id,
          title: journal.title,
          content: journal.content,
          date: journal.date,
          userId: journal.userId,
          image: journal.image || null, // Ensure image is included
        },
      });
    } catch (error) {
      console.error("Error fetching journal:", error);
      res.status(500).json({
        success: false,
        error: "Server error while fetching journal",
      });
    }
  };