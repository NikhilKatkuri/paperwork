/* -------------------------------------------------------------------------- */
/*  Paperwork email templates — Google / Material style                       */
/*  Table-based, inline-styled for Gmail, Outlook and Apple Mail.             */
/* -------------------------------------------------------------------------- */

function escapeHtml(value: unknown): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeAttr(value: unknown): string {
    return escapeHtml(value).replace(/`/g, '&#96;');
}

/** Only allow http(s) links in href attributes; anything else becomes "#". */
function safeUrl(value: unknown): string {
    const url = String(value ?? '').trim();
    return /^https?:\/\//i.test(url) ? escapeAttr(url) : '#';
}

const webUrl = (path: string) =>
    safeUrl(`${(process.env.WEB_URL ?? '').replace(/\/$/, '')}${path}`);

/**
 * Logo files live in /public/email/ (see email-assets/). Gmail and Outlook block
 * SVG and data: URIs, so the logo is a hosted PNG referenced by absolute URL.
 * Override with EMAIL_ASSET_URL if you serve them from a CDN.
 */
const assetUrl = (file: string) =>
    safeUrl(`${process.env.EMAIL_ASSET_URL!}`.replace(/\/$/, '') + `/${file}`);

/* ------------------------------ Design tokens ------------------------------ */

const FONT = "'Google Sans',Roboto,'Helvetica Neue',Arial,sans-serif";

const C = {
    page: '#ffffff',
    border: '#dadce0',
    divider: '#e8eaed',
    surface: '#f8f9fa',
    text: '#202124',
    body: '#3c4043',
    muted: '#5f6368',
    faint: '#70757a',
    blue: '#1a73e8',
    blueSoft: '#e8f0fe',
    green: '#137333',
    greenSoft: '#e6f4ea',
    red: '#c5221f',
    redSoft: '#fce8e6',
    amber: '#b06000',
    amberSoft: '#fef7e0',
};

type Tone = 'info' | 'success' | 'warning' | 'danger';

const TONES: Record<Tone, { bg: string; fg: string; glyph: string }> = {
    info: { bg: C.blueSoft, fg: C.blue, glyph: 'i' },
    success: { bg: C.greenSoft, fg: C.green, glyph: '&#10003;' },
    warning: { bg: C.amberSoft, fg: C.amber, glyph: '!' },
    danger: { bg: C.redSoft, fg: C.red, glyph: '!' },
};

/* ------------------------------ Building blocks ---------------------------- */

const DARK_MODE_CSS = `
<style>
  @media (prefers-color-scheme: dark) {
    .pw-bg { background:#131314 !important; }
    .pw-card { background:#1f1f1f !important; border-color:#3c4043 !important; }
    .pw-title { color:#e8eaed !important; }
    .pw-text { color:#bdc1c6 !important; }
    .pw-muted { color:#9aa0a6 !important; }
    .pw-box { background:#28292a !important; border-color:#3c4043 !important; }
    .pw-rule { border-color:#3c4043 !important; }
    .pw-strong { color:#e8eaed !important; }
    .pw-logo-light { display:none !important; }
    .pw-logo-dark { display:block !important; max-height:none !important; overflow:visible !important; }
  }
  @media only screen and (max-width:540px) {
    .pw-pad { padding-left:24px !important; padding-right:24px !important; }
  }
</style>`;

const logo = () => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
  <tr>
    <td style="padding-right:10px;" valign="middle">
      <img class="pw-logo-light" src="${assetUrl('paperwork-logo')}" width="32" height="32" alt="Paperwork"
           style="display:block;width:32px;height:32px;border:0;outline:none;" />
      <img class="pw-logo-dark" src="${assetUrl('paperwork-logo-dark')}" width="32" height="32" alt="Paperwork"
           style="display:none;max-height:0;overflow:hidden;mso-hide:all;width:32px;height:32px;border:0;outline:none;" />
    </td>
    <td valign="middle" class="pw-muted" style="font-family:${FONT};font-size:22px;font-weight:500;color:${C.muted};letter-spacing:-0.2px;">
      Paperwork
    </td>
  </tr>
</table>`;

const icon = (tone: Tone) => {
    const t = TONES[tone];
    return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
  <tr>
    <td width="48" height="48" align="center" valign="middle" bgcolor="${t.bg}"
        style="width:48px;height:48px;border-radius:24px;background:${t.bg};color:${t.fg};font-family:${FONT};font-size:24px;font-weight:700;line-height:48px;">
      ${t.glyph}
    </td>
  </tr>
</table>`;
};

const heading = (text: string) => `
<h1 class="pw-title" style="margin:0;font-family:${FONT};font-size:24px;line-height:32px;font-weight:400;color:${C.text};text-align:center;">
  ${text}
</h1>`;

const paragraph = (
    html: string,
    opts: { muted?: boolean; align?: 'left' | 'center' } = {}
) => `
<p class="${opts.muted ? 'pw-muted' : 'pw-text'}" style="margin:0 0 16px;font-family:${FONT};font-size:14px;line-height:22px;color:${opts.muted ? C.muted : C.body};text-align:${opts.align ?? 'left'};letter-spacing:0.1px;">
  ${html}
</p>`;

const button = (label: string, href: string) => `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:8px auto 8px;">
  <tr>
    <td align="center" bgcolor="${C.blue}" style="border-radius:4px;background:${C.blue};">
      <a href="${href}" target="_blank"
         style="display:inline-block;padding:10px 24px;font-family:${FONT};font-size:14px;line-height:20px;font-weight:500;letter-spacing:0.25px;color:#ffffff;text-decoration:none;border-radius:4px;">
        ${escapeHtml(label)}
      </a>
    </td>
  </tr>
</table>`;

const detailBox = (rows: Array<{ label: string; value: string }>) => `
<table role="presentation" class="pw-box" width="100%" cellpadding="0" cellspacing="0" border="0"
       style="margin:8px 0 24px;border:1px solid ${C.border};border-radius:8px;background:${C.surface};">
  ${rows
      .map(
          (row, i) => `
  <tr>
    <td class="pw-rule" style="padding:12px 16px;${i > 0 ? `border-top:1px solid ${C.divider};` : ''}font-family:${FONT};">
      <div class="pw-muted" style="font-size:12px;line-height:16px;color:${C.muted};letter-spacing:0.3px;">${escapeHtml(row.label)}</div>
      <div class="pw-strong" style="margin-top:2px;font-size:14px;line-height:20px;color:${C.text};word-break:break-all;">${row.value}</div>
    </td>
  </tr>`
      )
      .join('')}
</table>`;

interface LayoutOptions {
    preheader: string;
    tone: Tone;
    title: string;
    body: string;
    footer?: string;
}

const layout = ({ preheader, tone, title, body, footer }: LayoutOptions) => `
${DARK_MODE_CSS}
<div class="pw-bg" style="background:${C.page};padding:24px 8px;font-family:${FONT};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">
    ${escapeHtml(preheader)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">

        <table role="presentation" class="pw-card" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:520px;background:${C.page};border:1px solid ${C.border};border-radius:8px;">

          <tr>
            <td class="pw-pad" align="center" style="padding:40px 40px 0;">
              ${logo()}
            </td>
          </tr>

          <tr>
            <td class="pw-pad" align="center" style="padding:28px 40px 0;">
              ${icon(tone)}
            </td>
          </tr>

          <tr>
            <td class="pw-pad" style="padding:20px 40px 0;">
              ${heading(title)}
            </td>
          </tr>

          <tr>
            <td class="pw-pad" style="padding:24px 40px 40px;">
              ${body}
            </td>
          </tr>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
          <tr>
            <td align="center" style="padding:20px 24px 0;font-family:${FONT};font-size:12px;line-height:18px;color:${C.faint};" class="pw-muted">
              ${footer ? `${footer}<br />` : ''}
              &copy; ${new Date().getFullYear()} Paperwork
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</div>
`;

/* -------------------------------- Templates -------------------------------- */

export const formCreation = (formName: string, formId: string) =>
    layout({
        preheader: `${formName} is live and ready to collect responses.`,
        tone: 'success',
        title: 'Your form is live',
        body: `
${paragraph(
    `<strong class="pw-strong" style="color:${C.text};">${escapeHtml(formName)}</strong> has been published and is ready to collect responses. Share the link with your audience to get started.`
)}
${button('Open form', webUrl(`/forms/${formId}`))}
`,
        footer: 'You received this email because you published a form on Paperwork.',
    });

export const loginAlertTemplate = (
    device: string,
    location: string,
    time: string,
    ip?: string
) =>
    layout({
        preheader: 'New sign-in to your Paperwork account.',
        tone: 'info',
        title: 'New sign-in to your account',
        body: `
${paragraph('We noticed a new sign-in to your Paperwork account. Here are the details:')}
${detailBox([
    { label: 'Device', value: escapeHtml(device) },
    { label: 'Location', value: escapeHtml(location) },
    { label: 'Time', value: escapeHtml(time) },
    ...(ip
        ? [{ label: 'IP address (partially masked)', value: escapeHtml(ip) }]
        : []),
])}
${paragraph(
    "If this was you, you don't need to do anything. If you don't recognize this activity, reset your password right away to secure your account.",
    { muted: true }
)}
`,
        footer: 'We send this email to keep your account secure.',
    });

export const welcomeTemplate = (name: string) =>
    layout({
        preheader: 'Your Paperwork account is ready.',
        tone: 'success',
        title: `Welcome to Paperwork, ${escapeHtml(name)}`,
        body: `
${paragraph(
    'Your account is ready. Create forms, collect responses and manage your workflows from one place.'
)}
${button('Go to dashboard', webUrl('/dashboard'))}
`,
        footer: 'You received this email because you created a Paperwork account.',
    });

export const otpTemplate = (otp: string) =>
    layout({
        preheader: `Your Paperwork verification code is ${otp}.`,
        tone: 'info',
        title: 'Verify your account',
        body: `
${paragraph('Use this verification code to continue. Do not share it with anyone.', { align: 'center' })}
<table role="presentation" class="pw-box" cellpadding="0" cellspacing="0" border="0" align="center"
       style="margin:8px auto 16px;border:1px solid ${C.border};border-radius:8px;background:${C.surface};">
  <tr>
    <td class="pw-strong" align="center"
        style="padding:16px 32px;font-family:'Roboto Mono',Menlo,Consolas,monospace;font-size:32px;line-height:40px;font-weight:500;letter-spacing:8px;color:${C.text};">
      ${escapeHtml(otp)}
    </td>
  </tr>
</table>
${paragraph('This code expires in 5 minutes.', { muted: true, align: 'center' })}
`,
        footer: "If you didn't request this code, you can safely ignore this email.",
    });

export const forgotPasswordTemplate = (resetLink: string) =>
    layout({
        preheader: 'Reset your Paperwork password.',
        tone: 'warning',
        title: 'Reset your password',
        body: `
${paragraph('We received a request to reset the password for your Paperwork account. Select the button below to choose a new one.')}
${button('Reset password', safeUrl(resetLink))}
${paragraph(
    "If you didn't request a password reset, you can safely ignore this email. Your password won't change.",
    { muted: true }
)}
`,
        footer: 'We send this email to keep your account secure.',
    });

export const passwordResetSuccessTemplate = () =>
    layout({
        preheader: 'Your Paperwork password was changed.',
        tone: 'success',
        title: 'Your password was changed',
        body: `
${paragraph('Your Paperwork account is now secured with your new password. You can use it the next time you sign in.', { align: 'center' })}
`,
        footer: 'We send this email to keep your account secure.',
    });

export const passwordChangeAlertTemplate = (time: string) =>
    layout({
        preheader: 'The password for your Paperwork account was changed.',
        tone: 'danger',
        title: 'Your password was changed',
        body: `
${paragraph('The password for your Paperwork account was recently changed.')}
${detailBox([{ label: 'Time of change', value: escapeHtml(time) }])}
${paragraph(
    "If you made this change, you don't need to do anything. If you didn't, contact our support team or recover your account immediately.",
    { muted: true }
)}
`,
        footer: 'We send this email to keep your account secure.',
    });

export const formSubmissionConfirmed = (
    formName: string,
    submissionId: string
) =>
    layout({
        preheader: `We received your response to ${formName}.`,
        tone: 'success',
        title: 'Response received',
        body: `
${paragraph(
    `Your response to <strong class="pw-strong" style="color:${C.text};">${escapeHtml(formName)}</strong> has been recorded. Keep this email for your records.`
)}
${detailBox([
    {
        label: 'Submission ID',
        value: `<span style="font-family:'Roboto Mono',Menlo,Consolas,monospace;">${escapeHtml(submissionId)}</span>`,
    },
])}
${button('View your response', webUrl(`/submissions/${submissionId}`))}
`,
        footer: 'You received this email because you submitted a response on Paperwork.',
    });
