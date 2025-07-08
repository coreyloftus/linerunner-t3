# NextAuth Setup Guide

## Environment Variables

You need to create a `.env.local` file in your project root with the following variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

## Setup Steps

1. **Create `.env.local` file** with the variables above
2. **Replace the placeholder values**:

   - `NEXTAUTH_SECRET`: Generate a random string (you can use `openssl rand -base64 32`)
   - `GOOGLE_CLIENT_ID`: Your Google OAuth client ID from GCP
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth client secret from GCP

3. **Google OAuth Configuration**:
   - Make sure your Google OAuth app has the correct redirect URI: `http://localhost:3000/api/auth/callback/google`
   - For production, add your production domain as well

## Usage

The authentication is now set up with:

- ✅ NextAuth API routes configured
- ✅ Google OAuth provider enabled
- ✅ SessionProvider wrapped around your app
- ✅ AuthButton component created and added to Sidebar

You can use the `useSession()` hook in any component to access the current session:

```tsx
import { useSession } from "next-auth/react";

const MyComponent = () => {
  const { data: session, status } = useSession();

  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") return <div>Not signed in</div>;

  return <div>Welcome {session.user?.name}!</div>;
};
```

## Testing

1. Start your development server: `npm run dev`
2. Navigate to your app
3. Click the "Sign in with Google" button in the navbar
4. Complete the Google OAuth flow
5. You should see your name and a "Sign out" button

## Production Deployment

For production, make sure to:

1. Set `NEXTAUTH_URL` to your production domain
2. Add your production domain to Google OAuth redirect URIs
3. Use a strong, unique `NEXTAUTH_SECRET`
