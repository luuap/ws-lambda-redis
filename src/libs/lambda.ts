import middy from "@middy/core";

export const middyfy = (handler) => {
  return middy(handler).use(jsonBodyParser);
}

const jsonBodyParser = {
  before: (handler, next) => {
    handler.event.body = JSON.parse(handler.event.body);
    next();
  }
}