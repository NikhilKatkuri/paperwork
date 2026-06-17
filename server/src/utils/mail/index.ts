import nodemailer, { Transporter } from 'nodemailer';
import config from '@/config';

import {
    otpTemplate,
    welcomeTemplate,
    formCreation,
    forgotPasswordTemplate,
    passwordResetSuccessTemplate,
    loginAlertTemplate,
    passwordChangeAlertTemplate,
    formSubmissionConfirmed,
} from './templates';

interface MailPayload {
    to: string;
    subject: string;
    text?: string;
    html: string;
}

class MailService {
    private transporter: Transporter;

    constructor() {
        if (!config.mail.host || !config.mail.hostUser) {
            throw new Error(
                'Mail config is missing! Check your .env file loading.'
            );
        }
        this.transporter = nodemailer.createTransport({
            host: config.mail.host,
            port: Number(config.mail.port),
            secure: config.mail.secure,
            auth: {
                user: config.mail.hostUser,
                pass: config.mail.hostPass,
            },
        });
    }

    private async send({ to, subject, text, html }: MailPayload) {
        return this.transporter.sendMail({
            from: `"Paperwork" <${config.mail.hostUser}>`,
            to,
            subject,
            text,
            html,
        });
    }

    async sendOTPEmail(
        email: string,
        otp: string,
        subject: string = 'Your verification code'
    ) {
        return this.send({
            to: email,
            subject: subject,
            text: `Your OTP is ${otp}`,
            html: otpTemplate(otp),
        });
    }

    async sendWelcomeEmail(email: string, name: string) {
        return this.send({
            to: email,
            subject: 'Welcome to Paperwork',
            text: `Welcome to Paperwork ${name}`,
            html: welcomeTemplate(name),
        });
    }

    async sendFormCreatedEmail(
        email: string,
        formName: string,
        formId: string
    ) {
        return this.send({
            to: email,
            subject: 'Your form is live',
            text: `${formName} has been created`,
            html: formCreation(formName, formId),
        });
    }

    async sendForgotPasswordEmail(email: string, resetLink: string) {
        return this.send({
            to: email,
            subject: 'Reset your password',
            text: `Reset your password using this link: ${resetLink}`,
            html: forgotPasswordTemplate(resetLink),
        });
    }

    async sendPasswordResetSuccessEmail(email: string) {
        return this.send({
            to: email,
            subject: 'Password updated',
            text: 'Your password has been updated successfully',
            html: passwordResetSuccessTemplate(),
        });
    }

    async sendLoginAlertEmail(
        email: string,
        device: string,
        location: string,
        time: string
    ) {
        return this.send({
            to: email,
            subject: 'New login detected',
            text: `We noticed a new login to your account from ${device} in ${location} at ${time}. If this was you, you can safely ignore this email. If not, please secure your account immediately.`,
            html: loginAlertTemplate(device, location, time),
        });
    }

    async sendPasswordChangeAlertEmail(email: string, time: string) {
        return this.send({
            to: email,
            subject: 'Password Change Alert',
            text: `Your password was changed at ${time}. If this was you, you can safely ignore this email. If not, please secure your account immediately.`,
            html: passwordChangeAlertTemplate(time),
        });
    }
    async sendFormSubmissionConfirmedEmail(
        email: string,
        formName: string,
        submissionId: string
    ) {
        return this.send({
            to: email,
            subject: 'Form Submission Confirmed',
            text: `Your submission for ${formName} has been received. Submission ID: ${submissionId}`,
            html: formSubmissionConfirmed(formName, submissionId),
        });
    }
}

export default MailService;
