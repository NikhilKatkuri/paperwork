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
import { Resend } from 'resend';
import { SystemError } from '../AppError';

interface MailPayload {
    to: string;
    subject: string;
    text?: string;
    html: string;
}

type Mode = 'resend' | 'nodemailer';

class MailService {
    private transporter: Transporter | Resend;
    private mode: Mode = config.env === 'production' ? 'resend' : 'nodemailer';
    private number: number = 0;

    constructor() {
        if (config.env === 'production') {
            if (!config.RESEND_API_KEY) {
                throw new SystemError(
                    `[mailService]`,
                    'Resend API key is missing! Check your Render environment configurations.'
                );
            }
            this.transporter = new Resend(config.RESEND_API_KEY);
        } else {
            if (!config.mail.host || !config.mail.hostUser) {
                throw new SystemError(
                    `[mailService]`,
                    'Mail config is missing! Check your local .env file loading.'
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
    }

    private async mailMode(
        mode: Mode,
        props: {
            to: string;
            from: string;
            subject: string;
            text?: string;
            html: string;
        }
    ) {
        if (mode === 'resend') {
            try {
                const response = await (this.transporter as Resend).emails.send(
                    {
                        from: 'Paperwork <onboarding@resend.dev>',
                        to: props.to,
                        subject: props.subject,
                        text: props.text,
                        html: props.html,
                    }
                );

                if (response.error) {
                    console.error(
                        '[Email service -- Resend Error]:',
                        JSON.stringify(response.error, null, 2)
                    );
                    throw new Error(
                        `Resend payload rejected: ${response.error.message}`
                    );
                }

                this.number++;
                console.log(
                    `[Email service -- Resend]:[${new Date().toISOString()}] Email sent count (${this.number}) | Message ID: ${response.data?.id}`
                );
                return response.data;
            } catch (error) {
                console.error('Error sending email via Resend:', error);
                throw error;
            }
        }

        if (mode === 'nodemailer') {
            try {
                const info = await (this.transporter as Transporter).sendMail({
                    from: props.from,
                    to: props.to,
                    subject: props.subject,
                    text: props.text,
                    html: props.html,
                });
                this.number++;
                console.log(
                    `[Email service -- Nodemailer]:[${new Date().toISOString()}] Email sent via Nodemailer (${this.number})`
                );
                return info;
            } catch (error) {
                console.error('Error sending email via Nodemailer:', error);
                throw error;
            }
        }
    }

    private async send({ to, subject, text, html }: MailPayload) {
        const sender =
            config.env === 'production'
                ? 'Paperwork <onboarding@resend.dev>'
                : `"Paperwork" <${config.mail.hostUser}>`;

        return this.mailMode(this.mode, {
            from: sender,
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
            text: `We noticed a new login to your account from ${device} in ${location} at ${time}.`,
            html: loginAlertTemplate(device, location, time),
        });
    }

    async sendPasswordChangeAlertEmail(email: string, time: string) {
        return this.send({
            to: email,
            subject: 'Password Change Alert',
            text: `Your password was changed at ${time}.`,
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
