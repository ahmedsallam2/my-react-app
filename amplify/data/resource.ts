import { type ClientSchema, a, defineData } from '@aws-amplify/backend';
import { sayHello } from '../functions/say-hello/resource';

const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
      isDone: a.boolean(),
      fileKey: a.string(),
      fileName: a.string(),
    })
    .authorization((allow) => [allow.owner()]),

  sayHello: a
    .query()
    .arguments({ name: a.string() })
    .returns(a.string())
    .handler(a.handler.function(sayHello))
    .authorization((allow) => [allow.authenticated()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});