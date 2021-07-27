'use strict';
const jwt = require('jsonwebtoken');
const Joi = require("joi");
const crypto = require('crypto');
const connectToDatabase = require('../db');
const API_Responses = require('../response');
const User = require('../_models/User');
const tokenExpires = (5 * 60 * 60 * 1000);

module.exports.login = async (event, context) => {

    context.callbackWaitsForEmptyEventLoop = false;

    const body = JSON.parse(event.body);

    var schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
    });

    const options = { abortEarly: false, allowUnknown: true, stripUnknown: true };
    const { error, value } = schema.validate(body, options);
    if (error) {
        return API_Responses.response(400, JSON.stringify(error.details.map(c => c.message)));
    }

    try {
        var eventBody = JSON.parse(event.body);
        // sign the token and send it back
        return connectToDatabase()
            .then(() => login(eventBody))
            .then(session => API_Responses.response(200, '', session))
            .catch(err => API_Responses.response(400, err.message));


    } catch (err) {
        console.log(err);
        return API_Responses.response(400, err.message);
    }
};

module.exports.register = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const body = JSON.parse(event.body);

    var schema = Joi.object({
        name: Joi.string().required().max(250).min(2),
        email: Joi.string().email().required(),
        phoneNumber: Joi.string().required(),
        role: Joi.string().required(),
        password: Joi.string().regex(validation.regex.passwordRegex).required()
            .options({ messages: { 'string.pattern.base': validation.regex.passwordHint } })

    });
    const options = { abortEarly: false, allowUnknown: true, stripUnknown: true };
    const { error, value } = schema.validate(body, options);
    if (error) {
        return httpReturn.response(400, JSON.stringify(error.details.map(c => c.message)));
    }

    try {

        body.salt = makeSalt();
        body.hashedPassword = encryptPassword(body.password, body.salt)
        body.emailVerifyToken = makeSalt();

        return connectToDatabase()
            .then(() => createUser(body))
            .then(session => httpReturn.response(200, 'Record has been successfully created.', session))
            .catch(err => httpReturn.response(400, err.message));


    } catch (err) {
        console.log(err)
        return httpReturn.response(400, err.message);
    }
};

module.exports.me = (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;

    return connectToDatabase()
        .then(() =>
            me(event.requestContext.authorizer.principalId)
        )
        .then(session => httpReturn.response(200, '', session))
        .catch(err => httpReturn.response(400, err.message));
};

function signToken(user) {
    return jwt.sign({ id: user._id, email: user.email, companyId: user.CID._id }, process.env.JWT_SECRET, {
        expiresIn: '5h'        // expires in 5 hours
    });

}

function encryptPassword(password, salt) {
    if (!password || !salt)
        return '';
    var saltData = new Buffer.from(salt, 'base64');
    return crypto.pbkdf2Sync(password, saltData, 10000, 64, 'sha512').toString('base64');;
}

async function login(eventBody) {
    var user = await User.findOne({ email: eventBody.email });

    if (user === undefined || user === null || user.isDeleted || !user.isActive) {
        return Promise.reject(new Error('User with that email does not exits.'));
    }
    else {
        if (encryptPassword(eventBody.password, user.salt) === user.hashedPassword) {
            return {
                auth: true, token: signToken(user), user: basicDetails(user),
                expiresIn: new Date(Date.now() + tokenExpires).getTime()
            };
        }
        else {
            return Promise.reject(new Error('Incorrect username or password.'))
        }

    }
}

function createUser(eventBody) {
    return new Promise((resolve, reject) => {
        return resolve(User.findOne({ email: eventBody.email })); // check user exist 
    }).then(user =>
        user
            ? Promise.reject(new Error('User with that email exists.'))
            : user // hash the pass
    ).then(hash =>
        User.create(eventBody) // create the new user
    ).then(user => (basicDetails(user)));
}

function me(userId) {
    return User.findById(userId)
        .then(user =>
            !user
                ? Promise.reject('No user found.')
                : basicDetails(user)
        )
        .catch(err => Promise.reject(new Error(err)));
}


function basicDetails(user) {
    const { id, email, firstName, lastName, role, emailVerified, IsVerified } = user;
    return {
        id, email, firstName, lastName, role, emailVerified, IsVerified,
    };
}

