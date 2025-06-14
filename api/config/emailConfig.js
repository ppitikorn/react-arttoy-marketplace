// config/emailConfig.js
const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  // For Gmail, you'll need to use App Passwords
  // Go to Google Account settings > Security > 2-Step Verification > App passwords
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS 
    }
  });
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
const sendVerificationEmail = async (email, otp, userName) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: {
      name: 'Art Toy Marketplace',
      address: process.env.EMAIL_USER || 'your-email@gmail.com'
    },
    to: email,
    subject: 'Email Verification - Art Toy Marketplace',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #FF4C4C; margin: 0;">Art Toy Marketplace</h1>
            <h2 style="color: #333; margin: 10px 0;">Email Verification</h2>
          </div>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Hello <strong>${userName}</strong>,
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Thank you for joining Art Toy Marketplace! To complete your registration and verify your email address, please use the following One-Time Password (OTP):
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #FF4C4C; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 4px; display: inline-block;">
              ${otp}
            </div>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>Important:</strong> This OTP will expire in 10 minutes. For security reasons, please do not share this code with anyone.
            </p>
          </div>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            If you didn't request this verification, please ignore this email.
          </p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This email was sent from Art Toy Marketplace. Please do not reply to this email.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateOTP,
  sendVerificationEmail
};
