import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'todoFiles',
  access: (allow) => ({
    'todo-files/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
    ],
  }),
});