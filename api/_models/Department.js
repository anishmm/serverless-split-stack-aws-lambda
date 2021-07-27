const mongoose = require('mongoose');
const companySchema = new mongoose.Schema({
    name: { type: String, required: true },
    Active: { type: Boolean, default: false },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: false
    },
}, { timestamps: true });

module.exports = mongoose.model('Department', companySchema, 'department');