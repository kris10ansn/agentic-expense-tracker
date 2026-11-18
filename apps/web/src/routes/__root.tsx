import {
  createRootRoute,
  Link,
  Outlet,
  useRouter,
} from "@tanstack/react-router";
import { Button } from "../components/inputs";
import { LoadingScreen } from "../components/LoadingScreen";

function NotFoundPage() {
  return (
    <main className="font-inter mx-auto max-w-lg px-6 py-16">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link
        to="/"
        className="mt-6 inline-flex min-h-11 items-center text-sm text-blue-600"
      >
        Back to Home
      </Link>
    </main>
  );
}

function ErrorPage() {
  const router = useRouter();
  return (
    <main className="font-inter mx-auto max-w-lg px-6 py-16">
      <h1 className="text-2xl font-semibold">Unable to load this page</h1>
      <Button className="mt-6" onClick={() => void router.invalidate()}>
        Try again
      </Button>
    </main>
  );
}

export const Route = createRootRoute({
  component: Outlet,
  notFoundComponent: NotFoundPage,
  errorComponent: ErrorPage,
  pendingComponent: () => <LoadingScreen kind="loading" phase="loading" />,
});
