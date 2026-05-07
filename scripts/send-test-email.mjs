import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  throw new Error(
    "Missing RESEND_API_KEY. Add it to your .env file before running this script.",
  );
}

const resend = new Resend(apiKey);

const { data, error } = await resend.emails.send({
  from: "onboarding@resend.dev",
  to: "mariana.carvalho.sd@gmail.com",
  subject: "Hello World",
  html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
});

if (error) {
  console.error("Resend send failed:", error);
  process.exit(1);
}

console.log("Email sent successfully. Message ID:", data?.id);
