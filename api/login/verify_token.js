const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
// Policy helper function
const generatePolicy = (principalId, companyId, effect, resource) => {
    const authResponse = {};
    authResponse.principalId = principalId;
    if (effect && resource) {
        const policyDocument = {};
        policyDocument.Version = '2012-10-17';
        policyDocument.Statement = [];
        const statementOne = {};
        statementOne.Action = 'execute-api:Invoke';
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }
    console.log(authResponse)
    return authResponse;
}

module.exports.auth = (event, context, callback) => {
    context.callbackWaitsForEmptyEventLoop = false;
    // check header or url parameters or post parameters for token
    const token = event.authorizationToken;
    if (!token)
        return callback('Unauthorized');

    // verifies secret and checks exp
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return callback('Unauthorized');
        }
        // if everything is good, save to request for use in other routes
        return callback(null, generatePolicy(decoded.id, decoded.companyId, 'Allow', event.methodArn))
    });

};