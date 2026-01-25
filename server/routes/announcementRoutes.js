const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Announcement = require('../models/Announcement');
const User = require('../models/User'); // Import User model to get emails/phones
const sendEmail = require('../utils/sendEmail');

// Placeholder for SMS sending function
const sendSMS = async (phoneNumber, message) => {
  console.log(`Sending SMS to ${phoneNumber}: ${message}`);
  // Implement actual SMS sending logic here using a service like Twilio
};

// @route   POST api/announcements
// @desc    Create a new announcement (Admin only)
// @access  Private/Admin
router.post('/', auth, async (req, res) => {
  // In a real application, you'd check for admin role here.
  // For now, assuming any authenticated user can create announcements for testing.
  const { title, content, sendEmail: sendEmailFlag, sendSMS: sendSMSFlag } = req.body;

  try {
    const announcement = new Announcement({
      title,
      content,
      author: req.user.id,
      sendEmail: sendEmailFlag || false,
      sendSMS: sendSMSFlag || false,
    });

    const createdAnnouncement = await announcement.save();

    if (sendEmailFlag || sendSMSFlag) {
      const users = await User.find({}); // Get all users for notifications
      const emailSubject = `New Announcement: ${title}`;
      const emailMessage = `<h1>${title}</h1><p>${content}</p>`;
      const smsMessage = `New Announcement: ${title} - ${content.substring(0, 100)}...`;

      for (const user of users) {
        if (sendEmailFlag && user.email) {
          await sendEmail({
            email: user.email,
            subject: emailSubject,
            message: emailMessage,
          });
        }
        if (sendSMSFlag && user.phone) {
          await sendSMS(user.phone, smsMessage);
        }
      }
    }

    res.status(201).json(createdAnnouncement);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/announcements
// @desc    Get all announcements
// @access  Public
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find({}).populate('author', 'name email').sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/announcements/:id
// @desc    Get a single announcement by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id).populate('author', 'name email');

    if (!announcement) {
      return res.status(404).json({ msg: 'Announcement not found' });
    }

    res.json(announcement);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/announcements/:id
// @desc    Update an announcement (Admin only)
// @access  Private/Admin
router.put('/:id', auth, async (req, res) => {
  // In a real application, you'd check for admin role here.
  // For now, allowing any authenticated user to update (for testing).
  const { title, content, sendEmail: sendEmailFlag, sendSMS: sendSMSFlag } = req.body;

  try {
    let announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ msg: 'Announcement not found' });
    }

    // Ensure user is the author or admin
    if (announcement.author.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(401).json({ msg: 'Not authorized to update this announcement' });
    }

    announcement.title = title || announcement.title;
    announcement.content = content || announcement.content;
    announcement.sendEmail = sendEmailFlag !== undefined ? sendEmailFlag : announcement.sendEmail;
    announcement.sendSMS = sendSMSFlag !== undefined ? sendSMSFlag : announcement.sendSMS;

    const updatedAnnouncement = await announcement.save();

    if (sendEmailFlag || sendSMSFlag) {
      const users = await User.find({}); // Get all users for notifications
      const emailSubject = `Updated Announcement: ${title}`;
      const emailMessage = `<h1>${title}</h1><p>${content}</p>`;
      const smsMessage = `Updated Announcement: ${title} - ${content.substring(0, 100)}...`;

      for (const user of users) {
        if (sendEmailFlag && user.email) {
          await sendEmail({
            email: user.email,
            subject: emailSubject,
            message: emailMessage,
          });
        }
        if (sendSMSFlag && user.phone) {
          await sendSMS(user.phone, smsMessage);
        }
      }
    }

    res.json(updatedAnnouncement);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/announcements/:id
// @desc    Delete an announcement (Admin only)
// @access  Private/Admin
router.delete('/:id', auth, async (req, res) => {
  // In a real application, you'd check for admin role here.
  // For now, allowing any authenticated user to delete (for testing).
  try {
    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ msg: 'Announcement not found' });
    }

    // Ensure user is the author or admin
    if (announcement.author.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(401).json({ msg: 'Not authorized to delete this announcement' });
    }

    await Announcement.deleteOne({ _id: req.params.id });

    res.json({ msg: 'Announcement removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;