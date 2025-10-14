
import emailjs from 'emailjs-com';

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!;
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!;
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!;

interface OtpTemplateParams {
  to_email: string;
  otp_code: string;
}

export const sendOtpEmail = async (toEmail: string, otp: string): Promise<void> => {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.error("EmailJS environment variables are not set.");
    throw new Error("Email service is not configured.");
  }

  const templateParams: OtpTemplateParams = {
    to_email: toEmail,
    otp_code: otp,
  };

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    throw new Error("Could not send OTP email.");
  }
};
