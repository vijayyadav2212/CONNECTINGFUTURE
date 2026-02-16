require('dotenv').config();
const nodemailer = require('nodemailer');

async function val() {
    console.log("Testing email with:");
    console.log("User:", process.env.EMAIL_USER);
    // console.log("Pass:", process.env.EMAIL_PASS); // Don't log pass

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error("Missing credentials in .env");
        return;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const options = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_USER, // Send to self
        subject: 'Test Email from ConnectingFuture Debugger',
        text: 'If you see this, the email credentials are working!'
    };

    try {
        console.log("Attempting to send...");
        const info = await transporter.sendMail(options);
        console.log("Success! Email sent: " + info.response);
    } catch (e) {
        console.error("Failed to send email:", e);
    }
}

val();
