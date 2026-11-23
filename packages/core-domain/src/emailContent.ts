/** Keep outgoing messages tied to the site's configured identity. */
export function emailSiteName(value: string): string {
  return value.replace(/[\r\n\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120) || "your site";
}

export function contactEmailSubject(siteName: string, senderName: string): string {
  const sender = senderName.replace(/[\r\n\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 200) || "a visitor";
  return `New message from ${sender} via ${emailSiteName(siteName)}`;
}

export function recoveryEmailContent(siteName: string, resetUrl: string) {
  const name = emailSiteName(siteName);
  return {
    subject: `Reset your ${name} admin access`,
    text: `A request was made to reset your ${name} admin credentials.\n\nUse this one-time link within 15 minutes:\n${resetUrl}\n\nIf you did not make this request, you can ignore this email.`,
  };
}
