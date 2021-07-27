# AWS serverless stack -  example

This repository provides an example of using the [serverless framework](https://serverless.com) with split stacks
i.e. splitting the CloudFormation resources across multiple stacks.

## This example included blow points

1. ApiGateway Configuration
2. Create S3 Bucket
3. Login and Registration
4. Custom authentication
5. MongoDB Database
6. Upload Image in S3 Bucket

## Stacks 

 - `/serverless.yml` - the base stack Contains API Gateway,  API Authorizer, Create S3 Bucket  4XX & 5XX GatewayResponse
 - `/api/login/serverless.yml` - the stack for user registration login  
 - `/api/admin/serverless.yml` - the stack for posts management
 - `/api/common/serverless.yml` - the stack for upload file in s3 bucket base64 string and multipart 

## Deploying to AWS

You will need:
 - [nodejs 14](https://nodejs.org) or higher
 - an AWS account
 - [the awscli tool](https://aws.amazon.com/cli/)
 - serverless CLI tool (either installed globally i.e. `npm install -g serverless` or locally)

Steps:
1. First change the configuration in `config-(stage name).yml`
2. Install the npm modules

```bash
npm install
```

3. Deploy the base stack
```bash
`serverless deploy --stage dev`

if you have multiple AWS profile then use below comments

`serverless deploy --aws-profile my_profile_name --stage dev`
```

4. Change into the subdirectories and deploy the other stacks (using the same stage name):

```bash
cd api/admin
serverless deploy --stage dev

cd api/login
serverless deploy --stage dev

cd api/common
serverless deploy --stage dev
```
 