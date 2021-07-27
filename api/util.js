const mongoose = require('mongoose');
const moment = require('moment');
module.exports = {
    format_Date,
    isValidId,
    toObjectId
};

function format_Date(date) {
    return moment().format("YYYY-MMM-DD HH:mm:ss");
}

function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

function toObjectId(id) {
    var ObjectId = (require('mongoose').Types.ObjectId);
    return new ObjectId(id);
};