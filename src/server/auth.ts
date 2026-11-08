import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
  type Profile,
} from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import DiscordProvider from "next-auth/providers/discord";

import { env } from "~/env";

const hasVerifiedEmail = (
  provider: string | undefined,
  profile?: Profile,
  email?: string | null,
) => {
  if (
    !profile?.email ||
    profile.email.includes("/") ||
    profile.email.toLowerCase() !== email?.toLowerCase()
  ) return false;
  const verification = profile as Profile & {
    email_verified?: unknown;
    verified?: unknown;
  };
  return provider === "google"
    ? verification.email_verified === true
    : provider === "discord" && verification.verified === true;
};

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  debug: false,
  callbacks: {
    signIn: ({ account, profile, user }) =>
      hasVerifiedEmail(account?.provider, profile, user.email),
    jwt: ({ token, account, profile }) => {
      if (account) {
        token.emailVerified = hasVerifiedEmail(
          account.provider,
          profile,
          token.email,
        );
        token.id = account.providerAccountId;
      }
      // Older sessions must sign in again to establish verified email ownership.
      if (token.emailVerified !== true || !token.email) {
        throw new Error("Sign in again with a verified email address.");
      }
      delete token.accessToken;
      return token;
    },
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.id as string,
      },
    }),
  },
  // Removed PrismaAdapter since we're using Firestore
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
    // AppleProvider({
    //   clientId: process.env.APPLE_CLIENT_ID!,
    //   clientSecret: process.env.APPLE_CLIENT_SECRET!,
    // }),
    DiscordProvider({
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => getServerSession(authOptions);
