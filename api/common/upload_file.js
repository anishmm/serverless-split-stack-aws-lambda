const Multipart = require("lambda-multipart");
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require('uuid');
const fileType = require('file-type');
const httpReturn = require('../response');

const s3 = new AWS.S3({
    secretAccessKey: process.env.IAM_USER_SECRET,
    accessKeyId: process.env.IAM_USER_KEY,
});


module.exports.uploadBase64 = async (event) => {

    try {
        let encodedImage = JSON.parse(event.body).base64Data;
        let decodedImage = Buffer.from(encodedImage, 'base64');

        const mimeInfo = await fileType.fromBuffer(decodedImage);

        const filePath = `${uuidv4()}.${mimeInfo.ext}`;

        var params = {
            Body: decodedImage,
            Bucket: process.env.S3_BUCKET_NAME,
            Key: filePath,
            ContentType: mimeInfo.mime,
            //ACL: "public-read"
        };

        try {

            let uploadOutput = await s3.upload(params).promise();
            console.log(uploadOutput)

            return httpReturn.response(200, '', { fileName: uploadOutput.key, location: uploadOutput.Location });
        }
        catch (err) {
            return httpReturn.response(400, '', err);
        }

    }
    catch (err) {
        return httpReturn.response(400, '', err);
    }
};



module.exports.MultiPart = async (event, context) => {
    const { fields, files } = await parseMultipartFormData(event);

    if (files == null || files.length == 0) {
        return httpReturn.response(400, 'no file found in http request');
    }

    let uploadOutput = await Promise.all(
        files.map(async file => {
            return await uploadFileIntoS3(file);
        })
    );

    return httpReturn.response(200, '', uploadOutput.map(elem => ({ fileName: elem.key, location: elem.Location })));

};

const parseMultipartFormData = async event => {
    return new Promise((resolve, reject) => {
        const parser = new Multipart(event);

        parser.on("finish", result => {
            resolve({ fields: result.fields, files: result.files });
        });

        parser.on("error", error => {
            return reject(error);
        });
    });
};

const uploadFileIntoS3 = async file => {

    var out = getFile(file);

    console.log(out)

    const options = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: out.fileName,
        Body: file,
        ContentType: out.contentType,
    };

    try {
        return await s3.upload(options).promise();
    } catch (err) {
        console.error(err);
        return err;
    }
};

const getFile = file => {
    const headers = file["headers"];
    if (headers == null) {
        throw new Error(`Missing "headers" from request`);
    }

    const contentType = headers["content-type"];
    let fileName = `${uuidv4()}.png`;

    var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    var matches = filenameRegex.exec(headers["content-disposition"]);
    if (matches != null && matches[1]) {
        fileName = matches[1].replace(/['"]/g, '');
    }
    var fileExtensionPattern = /\.([0-9a-z]+)(?=[?#])|(\.)(?:[\w]+)$/gmi
    fileName = `${uuidv4()}${fileName.match(fileExtensionPattern)[0]}`;

    return {
        contentType: contentType,
        fileName: fileName
    };
};