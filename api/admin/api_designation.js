'use strict';
const Joi = require("joi");
const connectToDatabase = require('../db');
const API_Response = require('../response');
const Designation = require('../_models/designation');
const util = require('../util');

module.exports.create = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;


    let body = JSON.parse(event.body);

    body.updatedBy = event.requestContext.authorizer.principalId     // Login user ID

    var schema = Joi.object({
        name: Joi.string().required().max(250).min(2),
        Active: Joi.boolean().default(true),
        CID: Joi.string().required()
    });

    const options = { abortEarly: false, allowUnknown: true, stripUnknown: true };
    const { error, value } = schema.validate(body, options);
    if (error) {
        return API_Response.response(400, JSON.stringify(error.details.map(c => c.message)));
    }

    try {

        // Create Database 
        return await connectToDatabase()
            .then(() => createDesignation(body))
            .then(session => API_Response.response(200, 'Database has been successfully created.', session))
            .catch(err => API_Response.response(400, err.message));


    } catch (err) {
        console.error(err);
        return API_Response.response(400, err.message);
    }
};

module.exports.update = async (event, context) => {

    context.callbackWaitsForEmptyEventLoop = false;

    const body = JSON.parse(event.body);

    var schema = Joi.object({
        name: Joi.string().required().max(250).min(2),
        id: Joi.string().required(),
        Active: Joi.boolean().default(true)
    });

    const options = { abortEarly: false, allowUnknown: true, stripUnknown: true };
    const { error, value } = schema.validate(body, options);
    if (error) {
        return API_Response.response(400, JSON.stringify(error.details.map(c => c.message)));
    }

    try {

        // Update Badge 
        return await connectToDatabase()
            .then(() => updateDesignation(body, body.id))
            .then(session => API_Response.response(200, 'Designation has been successfully updated.', session))
            .catch(err => API_Response.response(400, err.message));


    } catch (err) {
        console.error(err);
        return API_Response.response(400, err.message);
    }
};

module.exports.search = async (event, context) => {
    try {
        context.callbackWaitsForEmptyEventLoop = false;

        let query = {};
        let page = 0;
        let pageSize = 10;

        if (event.queryStringParameters !== null && event.queryStringParameters !== undefined) {
            query.search = event.queryStringParameters.key !== undefined ? event.queryStringParameters.key : '';
            query.sort = event.queryStringParameters.sort !== undefined ? event.queryStringParameters.sort : '';
            query.direction = event.queryStringParameters.direction !== undefined ? event.queryStringParameters.direction : '';

            page = event.queryStringParameters.page !== undefined ? parseInt(event.queryStringParameters.page) : 0;
            pageSize = event.queryStringParameters.size !== undefined ? parseInt(event.queryStringParameters.size) : 10;
        }

        return await connectToDatabase()
            .then(() => search(page, pageSize, query))
            .then(session => API_Response.response(200, '', session))
            .catch(err => API_Response.response(400, err.message));
    } catch (err) {
        console.error(err);
        return API_Response.response(400, err.message);
    }
}

module.exports.delete = (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;
    const { id } = event.pathParameters;

    var schema = Joi.object({ id: Joi.string().required() });
    const options = { abortEarly: false, allowUnknown: true, stripUnknown: true };
    const { error, value } = schema.validate(event.pathParameters, options);
    if (error) {
        return API_Response.response(400, JSON.stringify(error.details.map(c => c.message)));
    }

    return connectToDatabase()
        .then(() =>
            deleteMe(id)
        )
        .then(session => API_Response.response(200, '', session))
        .catch(err => API_Response.response(400, err.message));
};

module.exports.getAll = async (event, context) => {
    context.callbackWaitsForEmptyEventLoop = false;

    return connectToDatabase()
        .then(() => getAll()
        ).then(session => API_Response.response(200, '', session))
        .catch(err => API_Response.response(400, err.message));

}
/// TODO
function getAll() {
    return Designation.find({ isDeleted: { $in: [null, false] } })
        .then(obj =>
            !obj
                ? Promise.reject('No record found.')
                : obj.map(x => basicDetails(x))
        )
        .catch(err => Promise.reject(new Error(err)));
}

function createDesignation(eventBody) {

    return new Promise((resolve, reject) => {
        return resolve(Designation.findOne({ name: eventBody.name, CID: eventBody.CID })); // check user exist 
    }).then(data =>
        data
            ? Promise.reject(new Error('Designation name exists.'))
            : data
    ).then(hash =>
        Designation.create(eventBody)
    ).then(obj => (basicDetails(obj)));

}

function updateDesignation(eventBody, id) {
    return new Promise((resolve, reject) => {
        return resolve(Designation.findById(id)); // check user exist 
    }).then(data =>
        data
            ? data
            : Promise.reject(new Error('Designation not exist.'))
    ).then(obj => {
        Object.assign(obj, eventBody)
        obj.save()
        return Promise.resolve(obj);
    }
    ).then(obj => (basicDetails(obj))); // sign the token and send it back
}

function search(page, pageSize, query) {
    if (page == 0) { page = 1; }
    const skip = (page - 1) * pageSize;

    let search = { isDeleted: { $in: [null, false] } };
    let sort = {};
    if (query !== '' && query.sort !== undefined) {
        sort = { ...sort, [query.sort]: (query.direction === 'asc') ? 1 : -1 };
    }
    else {
        sort = { ['name']: 1 };
    }

    if (query !== '' && query.search !== undefined && query.search !== '') {
        search = {
            ...search,
            $or: [
                { name: { '$regex': query.search, '$options': 'i' } }
            ],
        }
    }
    const facetedPipeline = [{ $match: search }, { $sort: sort },
    {
        $facet: {
            data: [
                { $skip: skip },
                { $limit: pageSize }
            ],
            pagination: [
                { $match: search },
                { $count: 'total' }
            ]
        }
    }];

    //new Promise((resolve, reject) => {

    return Designation.aggregate(facetedPipeline)
        .then(result => {
            if (result === null || result == undefined || result[0].data.length <= 0) {
                return Promise.resolve({ totalCount: 0, list: [], })
            }
            else {
                return Promise.resolve({
                    totalCount: result[0].pagination[0].total,
                    list: result[0].data.map(x => basicDetails(x)),
                });

            }
        })
        .catch(err => Promise.reject(new Error(err)));

}

function deleteMe(id) {
    return Designation.findById(id)
        .then(obj => {
            !obj
                ? Promise.reject('No Designation found.')
                : obj.remove()
        }
        )
        .catch(err => Promise.reject(new Error(err)));
}

function basicDetails(obj) {

    const { name, Active, createdAt, CID } = obj;
    return {
        id: obj._id, name, Active, createdAt, CID
    };
}
