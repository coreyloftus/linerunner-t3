import NextAuth from "next-auth";
import { authOptions } from "~/server/auth";
import { type NextApiRequest, type NextApiResponse } from "next";

const handler = NextAuth(authOptions) as unknown as {
  GET: (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
  POST: (req: NextApiRequest, res: NextApiResponse) => Promise<void>;
};
export { handler as GET, handler as POST };
