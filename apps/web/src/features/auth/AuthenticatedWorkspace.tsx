import { useEffect, useState } from "react";
import { Button } from "../../components/inputs";
import { authClient, goToLogin } from "../../lib/auth";
import { WorkspaceLayout } from "../workspace/WorkspaceLayout";

function UserWorkspace({ userId }: { userId: string }) {
  const [initialUserId] = useState(userId);
  useEffect(() => {
    if (userId !== initialUserId) {
      window.location.replace("/");
    }
  }, [userId, initialUserId]);
  if (userId !== initialUserId) {
    return null;
  }
  return <WorkspaceLayout />;
}

export function AuthenticatedWorkspace() {
  const { data, isPending, error, refetch } = authClient.useSession();
  useEffect(() => {
    if (!isPending && !error && !data) {
      goToLogin();
    }
  }, [isPending, error, data]);

  if (error) {
    return (
      <main className="mx-auto max-w-lg p-6">
        <p role="alert">Unable to check your session.</p>
        <Button className="mt-4" onClick={() => void refetch()}>
          Try again
        </Button>
      </main>
    );
  }
  if (!data) {
    return (
      <p role="status" className="p-6 text-sm text-slate-500">
        Checking your session…
      </p>
    );
  }
  return <UserWorkspace userId={data.user.id} />;
}
