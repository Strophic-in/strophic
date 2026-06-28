/** Rendered email content ready to hand to a provider. */
export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export interface BrandContext {
  companyName: string;
  siteUrl: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Minimal, email-client-safe HTML shell with inline styles. */
function layout(opts: { title: string; bodyHtml: string; brand: BrandContext; preheader?: string }): string {
  const { title, bodyHtml, brand, preheader } = opts;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a;">
    ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>` : ""}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:28px 32px;border-bottom:1px solid #e2e8f0;">
                <a href="${brand.siteUrl}" style="font-size:18px;font-weight:700;color:#4f46e5;text-decoration:none;">${escapeHtml(brand.companyName)}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;font-size:15px;line-height:1.6;color:#334155;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
                © ${brand.companyName} · <a href="${brand.siteUrl}" style="color:#94a3b8;">${escapeHtml(brand.siteUrl)}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function button(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:12px;">${escapeHtml(label)}</a>`;
}

/** Admin password-reset email. */
export function passwordResetEmail(opts: {
  resetUrl: string;
  expiresMinutes: number;
  brand: BrandContext;
}): RenderedEmail {
  const { resetUrl, expiresMinutes, brand } = opts;
  const subject = `Reset your ${brand.companyName} password`;
  const html = layout({
    title: subject,
    brand,
    preheader: `This link expires in ${expiresMinutes} minutes.`,
    bodyHtml: `
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">Reset your password</h1>
      <p style="margin:0 0 20px;">We received a request to reset your password. Click below to choose a new one. This link expires in ${expiresMinutes} minutes.</p>
      <p style="margin:0 0 24px;">${button("Reset password", resetUrl)}</p>
      <p style="margin:0;color:#64748b;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>`,
  });
  const text = `Reset your ${brand.companyName} password\n\nOpen this link (expires in ${expiresMinutes} minutes):\n${resetUrl}\n\nIf you didn't request this, ignore this email.`;
  return { subject, html, text };
}

/** Confirmation sent to a visitor after they submit the contact form (Phase 3). */
export function leadConfirmationEmail(opts: { name: string; brand: BrandContext }): RenderedEmail {
  const { name, brand } = opts;
  const subject = `Thanks for reaching out to ${brand.companyName}`;
  const html = layout({
    title: subject,
    brand,
    preheader: "We received your message and will reply shortly.",
    bodyHtml: `
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">Thanks, ${escapeHtml(name)} 👋</h1>
      <p style="margin:0 0 20px;">We've received your message and a member of our team will get back to you shortly - usually within one business day.</p>
      <p style="margin:0;color:#64748b;font-size:13px;">- The ${escapeHtml(brand.companyName)} team</p>`,
  });
  const text = `Thanks, ${name}!\n\nWe've received your message and will get back to you shortly.\n\n- The ${brand.companyName} team`;
  return { subject, html, text };
}

/** Daily digest to the owner: tasks needing attention + new leads (Phase 6). */
export function dailyDigestEmail(opts: {
  overdue: { title: string; dueDate: string }[];
  dueToday: { title: string; dueDate: string }[];
  upcoming: { title: string; dueDate: string }[];
  newLeads: number;
  adminUrl: string;
  brand: BrandContext;
}): RenderedEmail {
  const { overdue, dueToday, upcoming, newLeads, adminUrl, brand } = opts;
  const subject = `Your ${brand.companyName} daily digest`;

  const taskList = (items: { title: string; dueDate: string }[]): string =>
    items
      .map(
        (t) =>
          `<li style="margin:0 0 6px;"><strong>${escapeHtml(t.title)}</strong> <span style="color:#94a3b8;">· ${escapeHtml(t.dueDate)}</span></li>`,
      )
      .join("");

  const section = (heading: string, items: { title: string; dueDate: string }[], color: string): string =>
    items.length
      ? `<h2 style="margin:20px 0 8px;font-size:15px;color:${color};">${escapeHtml(heading)} (${items.length})</h2><ul style="margin:0;padding-left:18px;">${taskList(items)}</ul>`
      : "";

  const nothing = !overdue.length && !dueToday.length && !upcoming.length;

  const html = layout({
    title: subject,
    brand,
    preheader: `${overdue.length} overdue · ${dueToday.length} due today · ${newLeads} new lead(s)`,
    bodyHtml: `
      <h1 style="margin:0 0 8px;font-size:20px;color:#0f172a;">Daily digest</h1>
      <p style="margin:0 0 8px;color:#334155;">${newLeads} new lead${newLeads === 1 ? "" : "s"} in the last 24 hours.</p>
      ${section("Overdue", overdue, "#dc2626")}
      ${section("Due today", dueToday, "#b45309")}
      ${section("Coming up", upcoming, "#4f46e5")}
      ${nothing ? `<p style="margin:16px 0;color:#64748b;">No tasks need attention today. 🎉</p>` : ""}
      <p style="margin:24px 0 0;">${button("Open admin", adminUrl)}</p>`,
  });

  const lines = (label: string, items: { title: string; dueDate: string }[]): string =>
    items.length ? `\n${label}:\n${items.map((t) => `  - ${t.title} (${t.dueDate})`).join("\n")}\n` : "";
  const text = `Daily digest\n\n${newLeads} new lead(s) in the last 24h.\n${lines("Overdue", overdue)}${lines("Due today", dueToday)}${lines("Coming up", upcoming)}\nOpen admin: ${adminUrl}`;

  return { subject, html, text };
}

/** Internal notification to the team for a new lead (Phase 3). */
export function leadNotificationEmail(opts: {
  lead: { name: string; email: string; company?: string; message: string; source?: string };
  adminUrl: string;
  brand: BrandContext;
}): RenderedEmail {
  const { lead, adminUrl, brand } = opts;
  const subject = `New lead: ${lead.name}${lead.company ? ` (${lead.company})` : ""}`;
  const html = layout({
    title: subject,
    brand,
    preheader: `${lead.name} just submitted the contact form.`,
    bodyHtml: `
      <h1 style="margin:0 0 16px;font-size:20px;color:#0f172a;">New lead</h1>
      <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;color:#334155;">
        <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Name</td><td>${escapeHtml(lead.name)}</td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#64748b;">Email</td><td>${escapeHtml(lead.email)}</td></tr>
        ${lead.company ? `<tr><td style="padding:4px 12px 4px 0;color:#64748b;">Company</td><td>${escapeHtml(lead.company)}</td></tr>` : ""}
        ${lead.source ? `<tr><td style="padding:4px 12px 4px 0;color:#64748b;">Source</td><td>${escapeHtml(lead.source)}</td></tr>` : ""}
      </table>
      <p style="margin:16px 0;padding:16px;background:#f8fafc;border-radius:12px;white-space:pre-wrap;">${escapeHtml(lead.message)}</p>
      <p style="margin:0 0 4px;">${button("Open in admin", adminUrl)}</p>`,
  });
  const text = `New lead\n\nName: ${lead.name}\nEmail: ${lead.email}${lead.company ? `\nCompany: ${lead.company}` : ""}${lead.source ? `\nSource: ${lead.source}` : ""}\n\n${lead.message}\n\nOpen admin: ${adminUrl}`;
  return { subject, html, text };
}
