const mongoose = require('mongoose');

const announcementSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  sendEmail: {
    type: Boolean,
    default: false,
  },
  sendSMS: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;