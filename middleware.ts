import { createNextAuthMiddleware } from 'nextjs-basic-auth-middleware';

export const middleware = createNextAuthMiddleware({
  realm: 'slicing-pie',
  users: [
    { name: process.env.AUTH_USERNAME!, password: process.env.AUTH_PASSWORD! },
  ],
});
