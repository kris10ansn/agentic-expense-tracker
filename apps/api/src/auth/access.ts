export function isEmailAllowed(
  email: string,
  allowedEmails: readonly string[],
) {
  return allowedEmails.includes(email.trim().toLowerCase());
}
