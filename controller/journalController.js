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
  
      if (!title || !content) {
        return res.status(400).json({
          success: false,
          error: "Title and content are required",
        });
      }
  
      const journal = new journalModel({
        title,
        content,
        image,
        date: date || Date.now(),
        userId: req.userId // Add the authenticated user's ID
      });
  
      await journal.save();
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
      const { id } = req.params;
      const { title, content } = req.body;
  
      const journal = await journalModel.findOne({
        _id: id,
        userId: req.userId
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
        journal.image = `/uploads/${req.file.filename}`; // Update the image path
      }
  
      await journal.save();
      res.status(200).json({
        success: true,
        data: journal,
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
        data: journal,
      });
    } catch (error) {
      console.error("Error fetching journal:", error);
      res.status(500).json({
        success: false,
        error: "Server error while fetching journal",
      });
    }
  };