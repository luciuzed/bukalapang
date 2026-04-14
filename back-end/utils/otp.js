const { Resend } = require('resend');

const otpStore = {};

const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();

const createResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error('RESEND_API_KEY is required to send emails.');
  }

  return new Resend(apiKey);
};

const getFromEmail = () => {
  const fromEmail = process.env.RESEND_FROM;

  if (!fromEmail) {
    throw new Error('RESEND_FROM is required to send emails.');
  }

  return fromEmail;
};

const sendOtpEmail = async (recipient, otpCode) => {
  const fromEmail = getFromEmail();
  const resend = createResendClient();

  const { data, error } = await resend.emails.send({
    from: `MainYuk Support <${fromEmail}>`,
    to: [recipient],
    subject: `Your Verification Code: ${otpCode}`,
    html: `
      <div style="font-family: Poppins,sans-serif; min-width:1000px; overflow:auto; line-height:2">
        <div style="margin:50px auto; width:70%; padding:20px 0">
          <div style="border-bottom:1px solid #eee">
            <a href="" style="font-size:1.4em; color: #009966; text-decoration:none; font-weight:600">MainYuk!</a>
          </div>
          <p style="font-size:1.1em">Your MainYuk Verification Code</p>
          <p>This code expires after 1 minute or if you request a new one.</p>
          <h2 style="background: #009966; margin: 0 auto; width: max-content; padding: 0 10px; color: #fff; border-radius: 4px;">
            ${otpCode}
          </h2>
          <p style="font-size:0.9em;">Regards,<br />MainYuk Team</p>
          <hr style="border:none; border-top:1px solid #eee" />
          <div style="float:right; padding:8px 0; color:#aaa; font-size:0.8em; line-height:1; font-weight:300">
            <p>MainYuk Support</p>
            <p>Indonesia</p>
          </div>
        </div>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send OTP email via Resend: ${error.message}`);
  }

  console.log('OTP email sent via Resend:', data?.id || 'no-id-returned');
  return data;
};

const sendBookingStatusEmail = async ({ recipient, userName, bookingId, fieldName, status }) => {
  const fromEmail = getFromEmail();
  const resend = createResendClient();

  const normalizedStatus = String(status || '').trim().toLowerCase();
  const isConfirmed = normalizedStatus === 'confirmed';
  const statusLabel = isConfirmed ? 'CONFIRMED' : 'REJECTED';
  const accentColor = isConfirmed ? '#009966' : '#dc2626';
  const heading = isConfirmed ? 'Great news! Your booking is confirmed.' : 'Update on your booking request';
  const complementaryMessage = isConfirmed
    ? 'Get ready and have fun on the court! We hope you have an awesome game.'
    : 'No worries, you can explore other available slots and try booking again anytime.';
  const safeName = userName ? String(userName).trim() : 'there';
  const safeFieldName = fieldName ? String(fieldName).trim() : 'your selected field';

  const { data, error } = await resend.emails.send({
    from: `MainYuk Support <${fromEmail}>`,
    to: [recipient],
    subject: `Your booking was ${statusLabel}`,
    html: `
      <div style="font-family: Poppins,sans-serif; min-width:1000px; overflow:auto; line-height:2">
        <div style="margin:50px auto; width:70%; padding:20px 0">
          <div style="border-bottom:1px solid #eee">
            <a href="" style="font-size:1.4em; color: #009966; text-decoration:none; font-weight:600">MainYuk!</a>
          </div>
          <p style="font-size:1.1em">Hi ${safeName},</p>
          <p>${heading}</p>
          <h2 style="background: ${accentColor}; margin: 0 auto; width: max-content; padding: 0 12px; color: #fff; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">
            Your booking was ${statusLabel}
          </h2>
          <p style="margin-top:12px;">Booking ID: <strong>#${bookingId}</strong></p>
          <p>Field: <strong>${safeFieldName}</strong></p>
          <p>${complementaryMessage}</p>
          <p style="font-size:0.9em;">Regards,<br />MainYuk Team</p>
          <hr style="border:none; border-top:1px solid #eee" />
          <div style="float:right; padding:8px 0; color:#aaa; font-size:0.8em; line-height:1; font-weight:300">
            <p>MainYuk Support</p>
            <p>Indonesia</p>
          </div>
        </div>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send booking status email via Resend: ${error.message}`);
  }

  console.log('Booking status email sent via Resend:', data?.id || 'no-id-returned');
  return data;
};

module.exports = {
  otpStore,
  generateOtp,
  sendOtpEmail,
  sendBookingStatusEmail
};
