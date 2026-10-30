export function maskEmail(email?: string) {
  if (!email) return null;
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return null;
  const visibleLength = Math.min(2, localPart.length);
  return `${localPart.slice(0, visibleLength)}${"*".repeat(Math.max(3, localPart.length - visibleLength))}@${domain}`;
}
