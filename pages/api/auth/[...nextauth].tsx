import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export default NextAuth({
  secret: 'fIRA2Q7v1FogdWxBDGhc9HZI83h',
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (
          credentials?.username === process.env.AUTH_USERNAME &&
          credentials?.password === process.env.AUTH_PASSWORD
        ) {
          return { loggedIn: true };
        }

        // Return null if user data could not be retrieved
        return null;
      },
    }),
  ],
});
