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

const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'society@kamaxitriplex.me';
const SUPPORT_PHONE = process.env.SUPPORT_PHONE || '+91 90991 95719';

const buildAnnouncementEmail = ({ title, content, isUpdate = false }) => `
  <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:20px; color:#111827;">
    <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
      <div style="background:#1e3a8a; color:#ffffff; padding:16px 20px;">
        <h2 style="margin:0; font-size:18px;">${isUpdate ? 'Updated' : 'New'} Society Announcement</h2>
      </div>
      <div style="padding:20px;">
        <p style="margin-top:0;">Dear Resident,</p>
        <p>Please find ${isUpdate ? 'the updated details of' : 'a new'} society announcement below:</p>
        <table style="width:100%; border-collapse:collapse; margin:14px 0;">
          <tr>
            <td style="padding:8px; border:1px solid #e5e7eb; width:110px;"><strong>Title</strong></td>
            <td style="padding:8px; border:1px solid #e5e7eb;">${title}</td>
          </tr>
          <tr>
            <td style="padding:8px; border:1px solid #e5e7eb; vertical-align:top;"><strong>Details</strong></td>
            <td style="padding:8px; border:1px solid #e5e7eb; white-space:pre-line;">${content}</td>
          </tr>
        </table>
        <p>Please check the society portal regularly for further updates.</p>
        <p style="margin-bottom:0;">Regards,<br/><strong>KAMAXI TRIPLEX Society Management</strong></p>
      </div>
      <div style="background:#f3f4f6; padding:12px 20px; font-size:12px; color:#4b5563;">
        Support: ${SUPPORT_EMAIL} | ${SUPPORT_PHONE}
      </div>
    </div>
  </div>
`;

// @route   POST api/announcements
// @desc    Create a new announcement (Admin only)
// @access  Private/Admin
router.post('/', auth, async (req, res) => {
  // In a real application, you'd check for admin role here.
  // For now, assuming any authenticated user can create announcements for testing.
  const { title, content, sendEmail: sendEmailFlag, sendSMS: sendSMSFlag } = req.body;
  const normalizedTitle = String(title || '').trim();
  const normalizedContent = String(content || '').trim();

  if (!normalizedTitle || !normalizedContent) {
    return res.status(400).json({ msg: 'Title and content are required.' });
  }

  try {
    const announcement = new Announcement({
      title: normalizedTitle,
      content: normalizedContent,
      author: req.user.id,
      sendEmail: sendEmailFlag || false,
      sendSMS: sendSMSFlag || false,
    });

    const createdAnnouncement = await announcement.save();

    let notificationWarning = null;
    if (sendEmailFlag || sendSMSFlag) {
      try {
        const users = await User.find({}); // Get all users for notifications
        const emailSubject = `New Announcement: ${normalizedTitle}`;
        const emailMessage = buildAnnouncementEmail({ title: normalizedTitle, content: normalizedContent, isUpdate: false });
        const smsMessage = `New Announcement: ${normalizedTitle} - ${normalizedContent.substring(0, 100)}...`;

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
      } catch (notifyErr) {
        console.error('Announcement created but notification failed:', notifyErr.message);
        notificationWarning = 'Announcement created, but notification delivery failed.';
      }
    }

    return res.status(201).json({
      announcement: createdAnnouncement,
      warning: notificationWarning,
    });
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
  const normalizedTitle = title !== undefined ? String(title).trim() : undefined;
  const normalizedContent = content !== undefined ? String(content).trim() : undefined;

  try {
    let announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      return res.status(404).json({ msg: 'Announcement not found' });
    }

    // Ensure user is the author or admin
    if (announcement.author.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(401).json({ msg: 'Not authorized to update this announcement' });
    }

    announcement.title = normalizedTitle !== undefined && normalizedTitle !== '' ? normalizedTitle : announcement.title;
    announcement.content = normalizedContent !== undefined && normalizedContent !== '' ? normalizedContent : announcement.content;
    announcement.sendEmail = sendEmailFlag !== undefined ? sendEmailFlag : announcement.sendEmail;
    announcement.sendSMS = sendSMSFlag !== undefined ? sendSMSFlag : announcement.sendSMS;

    const updatedAnnouncement = await announcement.save();

    let notificationWarning = null;
    if (sendEmailFlag || sendSMSFlag) {
      try {
        const users = await User.find({}); // Get all users for notifications
        const outgoingTitle = announcement.title;
        const outgoingContent = announcement.content;
        const emailSubject = `Updated Announcement: ${outgoingTitle}`;
        const emailMessage = buildAnnouncementEmail({ title: outgoingTitle, content: outgoingContent, isUpdate: true });
        const smsMessage = `Updated Announcement: ${outgoingTitle} - ${outgoingContent.substring(0, 100)}...`;

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
      } catch (notifyErr) {
        console.error('Announcement updated but notification failed:', notifyErr.message);
        notificationWarning = 'Announcement updated, but notification delivery failed.';
      }
    }

    return res.json({
      announcement: updatedAnnouncement,
      warning: notificationWarning,
    });
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