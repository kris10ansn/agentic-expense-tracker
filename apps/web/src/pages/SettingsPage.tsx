import { useState } from "react";
import { Button, FormField, TextInput } from "../components/inputs";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { authClient, goToLogin } from "../lib/auth";

export function SettingsPage() {
  const { data } = authClient.useSession();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function changePassword(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const newPassword = String(values.get("newPassword"));
    setMessage("");
    setError("");
    if (newPassword !== values.get("confirmPassword")) {
      setError("The new passwords do not match.");
      return;
    }
    setPending(true);
    try {
      const result = await authClient.changePassword({
        currentPassword: String(values.get("currentPassword")),
        newPassword,
        revokeOtherSessions: true,
      });
      if (result.error) {
        setError(result.error.message ?? "Unable to change your password.");
        return;
      }
      form.reset();
      setMessage("Password changed. Other sessions have been signed out.");
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function signOut() {
    setPending(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) {
        setError("Unable to sign out. Please try again.");
        return;
      }
      goToLogin();
    } catch {
      setError("Unable to reach the server. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <PageHeader title="Settings" />
      <SectionCard className="mt-6 max-w-lg p-5 sm:p-6">
        <h2 className="font-semibold text-slate-900">Account</h2>
        <p className="mt-2 text-sm break-all text-slate-500">
          {data?.user.email}
        </p>
        <form className="mt-6 space-y-4" onSubmit={changePassword}>
          <FormField htmlFor="currentPassword" label="Current password">
            <TextInput
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              disabled={pending}
            />
          </FormField>
          <FormField
            htmlFor="newPassword"
            label="New password"
            hint="Use at least 12 characters."
          >
            <TextInput
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
              disabled={pending}
            />
          </FormField>
          <FormField htmlFor="confirmPassword" label="Confirm new password">
            <TextInput
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={12}
              maxLength={128}
              required
              disabled={pending}
            />
          </FormField>
          <Button type="submit" disabled={pending}>
            Change password
          </Button>
        </form>
        {error && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="mt-4 text-sm text-emerald-700">
            {message}
          </p>
        )}
        <div className="mt-6 border-t border-slate-100 pt-6">
          <Button variant="secondary" onClick={signOut} disabled={pending}>
            Sign out
          </Button>
        </div>
      </SectionCard>
    </>
  );
}
