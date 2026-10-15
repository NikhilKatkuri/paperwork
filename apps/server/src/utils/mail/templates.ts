export const formCreation = (formName: string, formId: string) => `
<div style="
    background:#f5f7fb;
    padding:40px 20px;
    font-family:Inter,Arial,sans-serif;
">
    <div style="
        max-width:600px;
        margin:auto;
        background:#ffffff;
        border-radius:20px;
        overflow:hidden;
        border:1px solid #eaeaea;
        box-shadow:0 10px 30px rgba(0,0,0,0.05);
    ">
        
        <!-- Header -->
        <div style="
            padding:32px 40px;
            border-bottom:1px solid #f1f1f1;
        ">
            <h1 style="
                margin:0;
                font-size:24px;
                color:#111827;
                font-weight:700;
                letter-spacing:-0.5px;
            ">
                Paperwork
            </h1>

            <p style="
                margin:8px 0 0;
                color:#6b7280;
                font-size:14px;
            ">
                Smart forms for modern teams
            </p>
        </div>

        <!-- Body -->
        <div style="padding:40px;">
            <div style="
                display:inline-block;
                background:#ecfdf3;
                color:#027a48;
                padding:6px 12px;
                border-radius:999px;
                font-size:13px;
                font-weight:600;
                margin-bottom:20px;
            ">
                Form Published
            </div>

            <h2 style="
                margin:0 0 16px;
                color:#111827;
                font-size:28px;
                line-height:1.3;
                letter-spacing:-1px;
            ">
                Your form is now live
            </h2>

            <p style="
                margin:0 0 24px;
                color:#4b5563;
                font-size:16px;
                line-height:1.7;
            ">
                <strong>${formName}</strong> has been successfully created and is ready to start collecting responses.
            </p>

            <div style="
                background:#f9fafb;
                border:1px solid #eeeeee;
                border-radius:14px;
                padding:18px;
                margin-bottom:32px;
            ">
                <p style="
                    margin:0;
                    color:#6b7280;
                    font-size:14px;
                ">
                    Share your form with your audience and start gathering insights instantly.
                </p>
            </div>

            <!-- CTA -->
            <div style="text-align:center;">
                <a 
                    href="https://your-app-url.com/forms/${formId}"
                    style="
                        display:inline-block;
                        background:#111827;
                        color:#ffffff;
                        text-decoration:none;
                        padding:14px 28px;
                        border-radius:12px;
                        font-size:15px;
                        font-weight:600;
                    "
                >
                    Open Form
                </a>
            </div>
        </div>

        <!-- Footer -->
        <div style="
            padding:24px 40px;
            border-top:1px solid #f1f1f1;
            text-align:center;
        ">
            <p style="
                margin:0;
                color:#9ca3af;
                font-size:13px;
                line-height:1.6;
            ">
                © 2026 Paperwork. Built for fast, frictionless workflows.
            </p>
        </div>
    </div>
</div>
`;

export const loginAlertTemplate = (
    device: string,
    location: string,
    time: string
) => `
<div style="background:#f5f7fb;padding:40px 20px;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:20px;border:1px solid #eaeaea;overflow:hidden;">

    <div style="padding:32px 40px;border-bottom:1px solid #f1f1f1;">
      <h1 style="margin:0;font-size:24px;color:#111827;">Paperwork</h1>
    </div>

    <div style="padding:40px;">
      <div style="display:inline-block;background:#eff6ff;color:#1d4ed8;padding:6px 12px;border-radius:999px;font-size:13px;font-weight:600;margin-bottom:20px;">
        Security Alert
      </div>

      <h2 style="margin:0 0 16px;font-size:28px;color:#111827;">
        New login detected
      </h2>

      <p style="color:#4b5563;font-size:16px;line-height:1.7;">
        We noticed a new sign in to your Paperwork account.
      </p>

      <div style="background:#f9fafb;border:1px solid #eee;border-radius:14px;padding:20px;margin:24px 0;">
        <p style="margin:0 0 10px;color:#111827;"><strong>${device}</p>
        <p style="margin:0 0 10px;color:#111827;"><strong>${location}</p>
        <p style="margin:0;color:#111827;"><strong>Time:</strong> ${time}</p>
      </div>

      <p style="color:#6b7280;font-size:14px;line-height:1.7;">
        If this was you, no action is needed. If you don’t recognize this activity, reset your password immediately.
      </p>
    </div>

    <div style="padding:24px 40px;border-top:1px solid #f1f1f1;text-align:center;">
      <p style="margin:0;color:#9ca3af;font-size:13px;">
        © 2026 Paperwork
      </p>
    </div>
  </div>
</div>
`;

export const welcomeTemplate = (name: string) => `
<div style="background:#f5f7fb;padding:40px 20px;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:20px;border:1px solid #eaeaea;overflow:hidden;">

    <div style="padding:32px 40px;border-bottom:1px solid #f1f1f1;">
      <h1 style="margin:0;font-size:24px;color:#111827;">Paperwork</h1>
      <p style="margin:8px 0 0;color:#6b7280;font-size:14px;">
        Smart forms for modern teams
      </p>
    </div>

    <div style="padding:40px;">
      <div style="display:inline-block;background:#ecfdf3;color:#027a48;padding:6px 12px;border-radius:999px;font-size:13px;font-weight:600;margin-bottom:20px;">
        Welcome
      </div>

      <h2 style="margin:0 0 16px;font-size:30px;color:#111827;">
        Welcome to Paperwork
      </h2>

      <p style="color:#4b5563;font-size:16px;line-height:1.7;">
        Hey ${name},
      </p>

      <p style="color:#4b5563;font-size:16px;line-height:1.7;">
        Your account is ready. You can now create forms, collect responses, and manage workflows with a faster and cleaner experience.
      </p>

      <div style="text-align:center;margin-top:32px;">
        <a href="https://your-app-url.com/dashboard"
          style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:600;">
          Open Dashboard
        </a>
      </div>
    </div>

    <div style="padding:24px 40px;border-top:1px solid #f1f1f1;text-align:center;">
      <p style="margin:0;color:#9ca3af;font-size:13px;">
        © 2026 Paperwork
      </p>
    </div>
  </div>
</div>
`;

export const otpTemplate = (otp: string) => `
<div style="background:#f5f7fb;padding:40px 20px;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:20px;border:1px solid #eaeaea;overflow:hidden;">

    <div style="padding:32px 40px;border-bottom:1px solid #f1f1f1;">
      <h1 style="margin:0;font-size:24px;color:#111827;">Paperwork</h1>
    </div>

    <div style="padding:40px;text-align:center;">
      <div style="display:inline-block;background:#eff6ff;color:#1d4ed8;padding:6px 12px;border-radius:999px;font-size:13px;font-weight:600;margin-bottom:20px;">
        Verification Code
      </div>

      <h2 style="margin:0 0 16px;font-size:28px;color:#111827;">
        Verify your account
      </h2>

      <p style="color:#4b5563;font-size:16px;line-height:1.7;">
        Use the verification code below to continue.
      </p>

      <div style="
        margin:32px auto;
        background:#111827;
        color:#fff;
        display:inline-block;
        padding:18px 32px;
        border-radius:16px;
        font-size:32px;
        letter-spacing:8px;
        font-weight:700;
      ">
        ${otp}
      </div>

      <p style="color:#9ca3af;font-size:14px;">
        This code expires in 10 minutes.
      </p>
    </div>

    <div style="padding:24px 40px;border-top:1px solid #f1f1f1;text-align:center;">
      <p style="margin:0;color:#9ca3af;font-size:13px;">
        © 2026 Paperwork
      </p>
    </div>
  </div>
</div>
`;

export const forgotPasswordTemplate = (resetLink: string) => `
<div style="background:#f5f7fb;padding:40px 20px;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:20px;border:1px solid #eaeaea;overflow:hidden;">

    <div style="padding:32px 40px;border-bottom:1px solid #f1f1f1;">
      <h1 style="margin:0;font-size:24px;color:#111827;">Paperwork</h1>
    </div>

    <div style="padding:40px;">
      <div style="display:inline-block;background:#fff7ed;color:#c2410c;padding:6px 12px;border-radius:999px;font-size:13px;font-weight:600;margin-bottom:20px;">
        Password Reset
      </div>

      <h2 style="margin:0 0 16px;font-size:28px;color:#111827;">
        Reset your password
      </h2>

      <p style="color:#4b5563;font-size:16px;line-height:1.7;">
        We received a request to reset your Paperwork password.
      </p>

      <div style="text-align:center;margin-top:32px;">
        <a href="${resetLink}"
          style="display:inline-block;background:#111827;color:#fff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:600;">
          Reset Password
        </a>
      </div>

      <p style="margin-top:32px;color:#9ca3af;font-size:14px;line-height:1.7;">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>

    <div style="padding:24px 40px;border-top:1px solid #f1f1f1;text-align:center;">
      <p style="margin:0;color:#9ca3af;font-size:13px;">
        © 2026 Paperwork
      </p>
    </div>
  </div>
</div>
`;

export const passwordResetSuccessTemplate = () => `
<div style="background:#f5f7fb;padding:40px 20px;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:20px;border:1px solid #eaeaea;overflow:hidden;">

    <div style="padding:32px 40px;border-bottom:1px solid #f1f1f1;">
      <h1 style="margin:0;font-size:24px;color:#111827;">Paperwork</h1>
    </div>

    <div style="padding:40px;text-align:center;">
      <div style="display:inline-block;background:#ecfdf3;color:#027a48;padding:6px 12px;border-radius:999px;font-size:13px;font-weight:600;margin-bottom:20px;">
        Password Updated
      </div>

      <h2 style="margin:0 0 16px;font-size:28px;color:#111827;">
        Your password has been changed
      </h2>

      <p style="color:#4b5563;font-size:16px;line-height:1.7;">
        Your account is now secured with your new password.
      </p>
    </div>

    <div style="padding:24px 40px;border-top:1px solid #f1f1f1;text-align:center;">
      <p style="margin:0;color:#9ca3af;font-size:13px;">
        © 2026 Paperwork
      </p>
    </div>
  </div>
</div>
`;

export const passwordChangeAlertTemplate = (time: string) => `
<div style="background:#f5f7fb;padding:40px 20px;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:20px;border:1px solid #eaeaea;overflow:hidden;">

    <div style="padding:32px 40px;border-bottom:1px solid #f1f1f1;">
      <h1 style="margin:0;font-size:24px;color:#111827;">Paperwork</h1>
    </div>

    <div style="padding:40px;">
      <div style="display:inline-block;background:#fef2f2;color:#dc2626;padding:6px 12px;border-radius:999px;font-size:13px;font-weight:600;margin-bottom:20px;">
        Security Alert
      </div>

      <h2 style="margin:0 0 16px;font-size:28px;color:#111827;">
        Password changed
      </h2>

      <p style="color:#4b5563;font-size:16px;line-height:1.7;">
        The password for your Paperwork account was recently changed.
      </p>

      <div style="background:#f9fafb;border:1px solid #eee;border-radius:14px;padding:20px;margin:24px 0;">
        <p style="margin:0;color:#111827;"><strong>Time of change:</strong> ${time}</p>
      </div>

      <p style="color:#6b7280;font-size:14px;line-height:1.7;">
        If you made this change, you can safely ignore this email. If you did not change your password, please contact our support team or recover your account immediately.
      </p>
    </div>

    <div style="padding:24px 40px;border-top:1px solid #f1f1f1;text-align:center;">
      <p style="margin:0;color:#9ca3af;font-size:13px;">
        © 2026 Paperwork
      </p>
    </div>
  </div>
</div>
`;

export const formSubmissionConfirmed = (
    formName: string,
    submissionId: string
) => `
<div style="
    background:#f5f7fb;
    padding:40px 20px;
    font-family:Inter,Arial,sans-serif;
">
    <div style="
        max-width:600px;
        margin:auto;
        background:#ffffff;
        border-radius:20px;
        overflow:hidden;
        border:1px solid #eaeaea;
        box-shadow:0 10px 30px rgba(0,0,0,0.05);
    ">
        
        <div style="
            padding:32px 40px;
            border-bottom:1px solid #f1f1f1;
        ">
            <h1 style="
                margin:0;
                font-size:24px;
                color:#111827;
                font-weight:700;
                letter-spacing:-0.5px;
            ">
                Paperwork
            </h1>

            <p style="
                margin:8px 0 0;
                color:#6b7280;
                font-size:14px;
            ">
                Smart forms for modern teams
            </p>
        </div>

        <div style="padding:40px;">
            <div style="
                display:inline-block;
                background:#eff6ff;
                color:#1d4ed8;
                padding:6px 12px;
                border-radius:999px;
                font-size:13px;
                font-weight:600;
                margin-bottom:20px;
            ">
                Submission Received
            </div>

            <h2 style="
                margin:0 0 16px;
                color:#111827;
                font-size:28px;
                line-height:1.3;
                letter-spacing:-1px;
            ">
                Thanks for filling it out!
            </h2>

            <p style="
                margin:0 0 24px;
                color:#4b5563;
                font-size:16px;
                line-height:1.7;
            ">
                Your response for <strong>${formName}</strong> has been successfully recorded. A copy of your submission has been safely logged under our system workflows.
            </p>

            <div style="
                background:#f9fafb;
                border:1px solid #eeeeee;
                border-radius:14px;
                padding:18px;
                margin-bottom:32px;
            ">
                <p style="
                    margin:0 0 4px;
                    color:#9ca3af;
                    font-size:12px;
                    text-transform:uppercase;
                    letter-spacing:0.5px;
                    font-weight:600;
                ">
                    Submission ID
                </p>
                <p style="
                    margin:0;
                    color:#111827;
                    font-family:monospace;
                    font-size:14px;
                ">
                    ${submissionId}
                </p>
            </div>

            <div style="text-align:center;">
                <a 
                    href="https://your-app-url.com/submissions/${submissionId}"
                    style="
                        display:inline-block;
                        background:#111827;
                        color:#ffffff;
                        text-decoration:none;
                        padding:14px 28px;
                        border-radius:12px;
                        font-size:15px;
                        font-weight:600;
                    "
                >
                    View Your Response
                </a>
            </div>
        </div>

        <div style="
            padding:24px 40px;
            border-top:1px solid #f1f1f1;
            text-align:center;
        ">
            <p style="
                margin:0;
                color:#9ca3af;
                font-size:13px;
                line-height:1.6;
            ">
                © 2026 Paperwork. Built for fast, frictionless workflows.
            </p>
        </div>
    </div>
</div>
`;
