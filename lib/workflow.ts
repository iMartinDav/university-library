import { Client as WorkflowClient } from "@upstash/workflow";
import { Client as QStashClient, resend } from "@upstash/qstash";
import config from "@/lib/config";

export const workflowClient = new WorkflowClient({
  baseUrl: config.env.upstash.qstashUrl,
  token: config.env.upstash.qstashToken,
});

const qstashClient = new QStashClient({
  token: config.env.upstash.qstashToken,
});

export const sendEmail = async ({
  email,
  subject,
  message,
}: {
  email: string;
  subject: string;
  message: string;
}) => {
  try {
    console.log(`Attempting to send email to ${email} with subject: ${subject}`);
    const result = await qstashClient.publishJSON({
      api: {
        name: "email",
        provider: resend({ token: config.env.resendToken }),
      },
      body: {
        from: "Martin DAVILA <aldntmi@gmail.com>",
        to: [email],
        subject,
        html: message,
      },
    });
    console.log(`Email sent successfully to ${email}, result:`, result);
    return result;
  } catch (error) {
    console.error(`Failed to send email to ${email}:`, error);
    throw error; // Re-throw the error to handle it in the workflow
  }
};
