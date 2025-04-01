const express = require('express');
const multer = require('multer');
const router = express.Router();
const userController = require('../controller/userController');
const habitController = require('../controller/habitController');
const journalController = require('../controller/journalController');
const reminderController = require('../controller/reminderController');
const profileController = require('../controller/profileController');
const auth = require('../middleware/auth');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, "uploads/"); // Save images in the "uploads" folder
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });
  const upload = multer({ storage });

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
router.get('/gethabitbyid/:id',auth,habitController.getHabit)
router.put('/updateHabit/:id',auth,habitController.updateHabit)
router.delete('/deleteHabit/:id',auth,habitController.deleteHabit)
router.post('/mark-complete', auth, habitController.markHabitComplete);
router.get("/stats", auth, habitController.getHabitStats);


router.post("/addjournal",auth,upload.single("image"), journalController.addJournal);
router.get("/getjournal",auth, journalController.getJournals);  
router.put("/updatejournal/:id",auth,upload.single("image"), journalController.updateJournal); 
router.delete("/deletejournal/:id",auth, journalController.deleteJournal); 
router.get("/getjournal/:id",auth, journalController.getJournalById);

router.post('/registerReminder', auth, reminderController.registerReminder);
router.get('/reminders', auth, reminderController.getReminders);
router.put('/updateReminder', auth, reminderController.updateReminderStatus);
router.post('/completeHabit', auth, reminderController.completeHabit);

router.get("/getprofile", auth, profileController.getProfile);
router.put("/updateprofile/:id", auth, profileController.updateProfile);

module.exports = router;