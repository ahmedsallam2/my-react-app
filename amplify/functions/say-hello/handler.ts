import type { Schema } from '../../data/resource';

export const handler: Schema['sayHello']['functionHandler'] = async (event) => {
  const { name } = event.arguments;
  const time = new Date().toISOString();
  return `Hello ${name}! 👋 This message came from AWS Lambda at ${time}`;
};