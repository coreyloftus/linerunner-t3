import NextAuth, { type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { env } from "~/env";
import { type NextApiRequest, type NextApiResponse } from "next";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user && token.sub) {
        (session.user as { id: string }).id = token.sub;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions) as unknown as {
  GET: (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
  POST: (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
};
export { handler as GET, handler as POST };
