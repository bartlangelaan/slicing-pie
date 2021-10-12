import initializeBasicAuth from 'nextjs-basic-auth';

const users = [
  { user: process.env.AUTH_USERNAME!, password: process.env.AUTH_PASSWORD! },
];

export const basicAuthCheck = initializeBasicAuth({
  users,
});
