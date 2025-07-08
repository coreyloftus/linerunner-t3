// Client-side component that uses server-side Firebase through tRPC
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

interface FirebaseDocument {
  id: string;
  userId?: string;
  [key: string]: unknown;
}

export default function UserDataDisplay() {
  const { data: session } = useSession();
  const [userData, setUserData] = useState<FirebaseDocument[]>([]);

  // Use tRPC to fetch user data from server-side Firebase
  const {
    data: firebaseData,
    isLoading,
    error,
  } = api.firebase.getUserDocuments.useQuery(
    { subcollectionName: "uploaded_data" },
    {
      enabled: !!session?.user?.id,
      refetchOnWindowFocus: false,
    },
  );

  // Set user data directly since it's already filtered by user
  useEffect(() => {
    if (firebaseData?.success && firebaseData.data) {
      setUserData(firebaseData.data as FirebaseDocument[]);
    } else {
      setUserData([]);
    }
  }, [firebaseData]);

  if (isLoading) {
    return <div>Loading user data...</div>;
  }

  if (error) {
    return <div>Error loading data: {error.message}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="mb-4 text-xl font-bold">Your Uploaded Data:</h2>
      {userData.length > 0 ? (
        <ul className="space-y-2">
          {userData.map((item) => (
            <li key={item.id} className="rounded border p-2">
              <pre className="overflow-auto text-sm">
                {JSON.stringify(item, null, 2)}
              </pre>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No data uploaded yet.</p>
      )}
    </div>
  );
}
