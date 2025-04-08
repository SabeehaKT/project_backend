const express = require('express');
const multer = require('multer');
const router = express.Router();
const userController = require('../controller/userController');
const habitController = require('../controller/habitController');
const journalController = require('../controller/journalController');
const reminderController = require('../controller/reminderController');
const profileController = require('../controller/profileController');
const auth = require('../middleware/auth');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/"); // Save images in the "uploads" folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
      },
  });
  
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Error handling middleware for multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

// Public routes
router.post('/register', userController.register);
router.post('/login', userController.login);

// Protected routes
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);
router.post('/change-password', auth, userController.changePassword);
router.post('/deactivate', auth, userController.deactivateAccount);

router.post('/createhabit',auth,habitController.createHabit)
router.get('/gethabit',auth,habitController.getHabits)
router.get('/gethabitbyid/:id',auth,habitController.getHabitById)
router.put('/updateHabit/:id',auth,habitController.updateHabit)
router.delete('/deleteHabit/:id',auth,habitController.deleteHabit)
router.post('/mark-complete', auth, habitController.markHabitComplete);
router.get("/stats", auth, habitController.getHabitStats);
router.get("/videosuggestions", auth, habitController.getVideoSuggestions);


router.post("/addjournal",auth,upload.single("image"), journalController.addJournal);
router.get("/getjournal",auth, journalController.getJournals);  
router.put("/updatejournal/:id",auth,upload.single("image"), journalController.updateJournal); 
router.delete("/deletejournal/:id",auth, journalController.deleteJournal); 
router.get("/getjournal/:id",auth, journalController.getJournalById);

router.post('/registerReminder', auth, reminderController.registerReminder);
router.get('/reminders', auth, reminderController.getReminders);
router.put('/updateReminder', auth, reminderController.updateReminderStatus);
router.post('/completeHabit', auth, reminderController.completeHabit);
router.post('/saveNotificationToken', auth, reminderController.saveNotificationToken);

router.get("/getprofile", auth, profileController.getProfile);
router.put("/updateprofile/:id", auth, profileController.updateProfile);

module.exports = router;