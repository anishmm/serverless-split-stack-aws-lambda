const mongoose = require('mongoose');
const companySchema = new mongoose.Schema({
    name: { type: String, required: true },
    Active: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Designation', companySchema, 'designation');