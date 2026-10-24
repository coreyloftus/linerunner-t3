import { useSession } from "next-auth/react";
import { type ProjectJSON } from "~/server/api/routers/scriptData";
import { type ProjectSource } from "~/app/context";
import { api } from "~/trpc/react";

export interface MyShow {
  project: ProjectJSON;
  source: Extract<ProjectSource, "user" | "shared">;
}

// The signed-in user's own shows plus the ones shared with them, as one list
export function useMyShows() {
  const { data: session, status } = useSession();
  const signedIn = !!session?.user;
  const options = { enabled: signedIn, refetchOnWindowFocus: false };
  const owned = api.scriptData.getAll.useQuery({ dataSource: "firestore" }, options);
  const shared = api.scriptData.getAll.useQuery({ dataSource: "shared" }, options);

  const shows: MyShow[] = [
    ...(owned.data?.allData ?? []).map((project) => ({ project, source: "user" as const })),
    ...(shared.data?.allData ?? []).map((project) => ({ project, source: "shared" as const })),
  ];

  return {
    signedIn,
    sessionLoading: status === "loading",
    shows,
    // True only once both lists have loaded and are empty
    isEmpty: signedIn && owned.isSuccess && shared.isSuccess && shows.length === 0,
    isLoading: owned.isLoading || shared.isLoading,
  };
}
