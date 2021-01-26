import 'source-map-support/register';

import { TextEncoder } from 'util';
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi";
import Redis from 'ioredis';

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway';
import { formatJSONResponse } from '@libs/apiGateway';
import { middyfy } from '@libs/lambda';

import schema from './schema';

const { REDIS_PORT, REDIS_HOST, REDIS_PASSWORD, AWS_REGION } = process.env;

// Handler is src/handler.main
const handler: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {

  console.log(event);

  let { connectionId, stage, domainName } = event.requestContext;

  let { message } = event.body;

  const redis = new Redis({ port: +REDIS_PORT, host: REDIS_HOST, password: REDIS_PASSWORD });

  let response = await redis.ping(); // Should return PONG

  await sendCallbackMessage({ connectionId, stage, domainName }, `Response from Redis: ${response}`);

  await redis.quit();

  return formatJSONResponse({
    echo: message,
  });

}

const sendCallbackMessage = async (context: any, message: string) => {

  let { connectionId, stage, domainName } = context;

  let apiGatewayManagementApi = new ApiGatewayManagementApiClient({
    apiVersion: '2018-11-29',
    endpoint: `https://${domainName}/${stage}`,
    region: AWS_REGION
  });

  const params = {
    ConnectionId: connectionId,
    Data: new TextEncoder().encode(message),
  };

  const command = new PostToConnectionCommand(params)

  // TODO: workaround for https://github.com/aws/aws-sdk-js-v3/issues/1830
  apiGatewayManagementApi.middlewareStack.add(
    (next) =>
      async (args) => {
        args.request['path'] = stage + args.request['path'];
        return await next(args);
      },
    { step: "build" },
  );

  // Make sure the lambda has permission Allow: execute-api:ManageConnections on arn:aws:execute-api{region}:{account-id}:{api-id}:{stage}/POST/@connections/*
  await apiGatewayManagementApi.send(command);
}

export const main = middyfy(handler);
