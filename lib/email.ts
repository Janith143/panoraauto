import nodemailer from 'nodemailer';

export const sendVerificationEmail = async (email: string, token: string) => {
    // If SMTP isn't provided, use a default dummy one or standard production one
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    let transporter;

    if (host && user && pass) {
        transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
        });
    } else {
        // Generate a test ethereal account if no SMTP provided (for local dev)
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005';
    const verifyUrl = `${appUrl}/verify-email?token=${token}`;

    const mailOptions = {
        from: process.env.SMTP_FROM || '"Panora Auto" <auto@panoralink.com>',
        to: email,
        subject: 'Verify your email address - Panora Auto',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0284C7; text-align: center;">Welcome to Panora Auto!</h2>
        <p style="font-size: 16px; color: #333; line-height: 1.5;">Please verify your email address to complete your registration by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0284C7; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Verify Email Address</a>
        </div>
        <p style="font-size: 14px; color: #666; text-align: center;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="font-size: 14px; color: #0284C7; text-align: center; word-break: break-all;">${verifyUrl}</p>
        <hr style="border: 1px solid #eee; margin-top: 30px;" />
        <p style="font-size: 12px; color: #999; text-align: center;">If you didn't create an account with Panora Auto, please ignore this email.</p>
      </div>
    `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Verification email sent: %s', info.messageId);

        // Log the Ethereal URL if using the test account
        if (!host) {
            console.log('Preview Email URL: %s', nodemailer.getTestMessageUrl(info));
        }
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    let transporter;

    if (host && user && pass) {
        transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
        });
    } else {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3005';
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    const mailOptions = {
        from: process.env.SMTP_FROM || '"Panora Auto" <auto@panoralink.com>',
        to: email,
        subject: 'Reset your password - Panora Auto',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #0284C7; text-align: center;">Password Reset Request</h2>
        <p style="font-size: 16px; color: #333; line-height: 1.5;">We received a request to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #0284C7; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">Reset Password</a>
        </div>
        <p style="font-size: 14px; color: #666; text-align: center;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="font-size: 14px; color: #0284C7; text-align: center; word-break: break-all;">${resetUrl}</p>
        <p style="font-size: 14px; color: #e74c3c; text-align: center; font-weight: bold;">This link will expire in 1 hour.</p>
        <hr style="border: 1px solid #eee; margin-top: 30px;" />
        <p style="font-size: 12px; color: #999; text-align: center;">If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
      </div>
    `,
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent: %s', info.messageId);
        if (!host) {
            console.log('Preview Email URL: %s', nodemailer.getTestMessageUrl(info));
        }
        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return false;
    }
};
