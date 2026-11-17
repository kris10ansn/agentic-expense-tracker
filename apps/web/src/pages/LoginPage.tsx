import { useState } from "react";
import { Button, FormField, TextInput } from "../components/inputs";
import { authClient } from "../lib/auth";

export function LoginPage() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function signIn(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const result = await authClient.signIn.email({
        email: String(values.get("email")).trim().toLowerCase(),
        password: String(values.get("password")),
        rememberMe: true,
      });
      if (result.error) {
        setError(
          "Unable to sign in. Check your email and password, or contact the app owner.",
        );
        return;
      }
      window.location.replace("/");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-emerald-700">AI Expenses</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Sign in
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Your expenses, in one place.
        </p>
        <form className="mt-8 space-y-5" onSubmit={signIn}>
          <FormField htmlFor="email" label="Email">
            <TextInput
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              disabled={pending}
            />
          </FormField>
          <FormField htmlFor="password" label="Password">
            <TextInput
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={pending}
            />
          </FormField>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-6 text-xs leading-relaxed text-slate-500">
          For access or a password reset, contact the app owner.
        </p>
      </section>
    </main>
  );
}
