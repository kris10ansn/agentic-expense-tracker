import { type ReactNode, useEffect, useState } from "react";
import { QueryError } from "../../components/QueryError";
import { authClient, goToLogin } from "../../lib/auth";
import { WorkspaceLayout } from "../workspace/WorkspaceLayout";
import { SessionScreen } from "./SessionScreen";

function UserWorkspace({
  userId,
  notice,
}: {
  userId: string;
  notice: ReactNode;
}) {
  const [initialUserId] = useState(userId);
  useEffect(() => {
    if (userId !== initialUserId) {
      window.location.replace("/");
    }
  }, [userId, initialUserId]);
  if (userId !== initialUserId) {
    return null;
  }
  return <WorkspaceLayout notice={notice} />;
}

export function AuthenticatedWorkspace() {
  const { data, isPending, isRefetching, error, refetch } =
    authClient.useSession();
  const sessionLost = error?.status === 401 || (!isPending && !error && !data);

  useEffect(() => {
    if (sessionLost) {
      goToLogin();
    }
  }, [sessionLost]);

  function retry() {
    void refetch();
  }

  if (!data || sessionLost) {
    if (error && !sessionLost) {
      return <SessionScreen kind="error" onRetry={retry} />;
    }
    return <SessionScreen kind="loading" />;
  }

  return (
    <UserWorkspace
      userId={data.user.id}
      notice={
        error && (
          <QueryError
            message="We couldn't reconnect. Your unsaved changes are still here."
            onRetry={retry}
            retrying={isRefetching}
          />
        )
      }
    />
  );
}
