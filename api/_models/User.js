const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
  firstName: { type: String },
  lastName: { type: String },
  email: { type: String, lowercase: true, unique: true, required: true },
  IsVerified: { type: Boolean, default: false },
  phoneNumber: { type: String },
  role: { type: String },
  dob: { type: String },
  profilePicture: { type: String },
  emailVerifyToken: { type: String },
  emailVerified: { type: Boolean, default: false },
  hashedPassword: { type: String, required: true },
  salt: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema, 'user');