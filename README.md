# ws-lambda-redis

Minimal setup for Web Socket <-> API Gateway <-> Lambda <-> Redis. It pings the Redis server and echoes your Web Socket message.

Does not use CloudFormation. Work with AWS solely through the web console. Only uses Serverless Framework for packaging.

This project has been generated using the `aws-nodejs-typescript` template from the [Serverless framework](https://www.serverless.com/).

## Requirements
- A WebSocket client ([wscat](https://www.npmjs.com/package/wscat) or a web app)
- A Gateway WebSocket API
- A Redis server

## Building, Deployment, and Testing

After dependencies have been installed:
1. Run `serverless package`
2. Create a Lambda with Node.js 12.x runtime and hook it up to a Gateway API route with Lambda proxy integration
3. Upload the `.zip` file in `./serverless`
4. Set the handler to `src/handler.main`
5. Add policy `Allow: execute-api:ManageConnections` on `arn:aws:execute-api{region}:{account-id}{api-id}:{stage}/POST/@connections/*` for the Lambda
6. Set the `REDIS_PORT`, `REDIS_HOST`, and `REDIS_PASSWORD` environment variables
7. Deploy the funtion
8. Make a websocket connection and trigger the route

Example Test:
> Payload must be in JSON so the body can be properly parsed
   ```
   $ wscat -c wss://abcdef123.execute-api.us-east-1.amazonaws.com/development
   Connected (press CTRL+C to quit)
   > {"action":"sendmessage", "message": "hello"}
   < Response from Redis: PONG
   < {"echo":"hello"}
   ```

### Project structure

```
.
├── src
│   ├── handler.ts           # Lambda handler source code
│   ├── schema.ts            # Lambda input event JSON-Schema
│   ├── index.ts             # Import/export of all Lambda configurations
│   │
│   └── libs                 # Lambda shared code
│       ├── apiGateway.ts    # API Gateway specific helpers
│       └── lambda.ts        # Middleware-related code
│
├── package.json
├── serverless.ts            # Serverless service file
├── tsconfig.json            # Typescript compiler configuration
└── webpack.config.js        # Webpack configuration
```

### 3rd party libraries

- [json-schema-to-ts](https://github.com/ThomasAribart/json-schema-to-ts) - uses JSON-Schema definitions used by API Gateway for HTTP request validation to statically generate TypeScript types in your lambda's handler code base
- [@serverless/typescript](https://github.com/serverless/typescript) - provides up-to-date TypeScript definitions for your `serverless.ts` service file
- [ioredis](https://github.com/luin/ioredis) - Redis client for Node.js, preferred for its TypeScript and Promises API support
- [middy](https://github.com/middyjs/middy) - middleware engine for Node.Js lambda
- [@aws-sdk/client-apigatewaymanagementapi](https://github.com/aws/aws-sdk-js-v3/tree/master/clients/client-apigatewaymanagementapi) - used to manage IAM authorization for POST requests to Gateway API