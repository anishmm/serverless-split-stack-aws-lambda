module.exports.response = (statusCode, message, data) => {
    console.log('error')
    const response = {
        headers: {
            'Access-Control-Allow-Origin' : '*',
            'Access-Control-Allow-Credentials' : true,
            'Content-Type': 'application/json'
        },
        statusCode: statusCode,
        body: JSON.stringify({
            "errorCode": statusCode,
            "status": statusCode === 200 ? true : false,
            data: data === undefined ? [] : data,
            message: message === undefined ? '' : message
        }),
    };
    return response;
};