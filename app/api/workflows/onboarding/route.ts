import { serve } from "@upstash/workflow/nextjs";
import { db } from "@/database/drizzle";
import { users } from "@/database/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "@/lib/workflow";

type UserState = "non-active" | "active";

type InitialData = {
  email: string;
  fullName: string;
};

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
const THREE_DAYS_IN_MS = 3 * ONE_DAY_IN_MS;
const THIRTY_DAYS_IN_MS = 30 * ONE_DAY_IN_MS;

const getUserState = async (email: string): Promise<UserState> => {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (user.length === 0) return "non-active";

  const lastActivityDate = new Date(user[0].lastActivityDate!);
  const now = new Date();
  const timeDifference = now.getTime() - lastActivityDate.getTime();

  if (
    timeDifference > THREE_DAYS_IN_MS &&
    timeDifference <= THIRTY_DAYS_IN_MS
  ) {
    return "non-active";
  }

  return "active";
};

export const { POST } = serve<InitialData>(async (context) => {
  const { email, fullName } = context.requestPayload;

  console.log(`Starting onboarding workflow for: ${email}`);

  try {
    // Welcome Email
    await context.run("new-signup", async () => {
      console.log(`Sending welcome email to: ${email}`);
      await sendEmail({
        email,
        subject: "Welcome to the platform",
        message: `Welcome ${fullName}!`,
      });
      console.log(`Welcome email sent to: ${email}`);
      return true; // Explicitly return a value
    });
    
    console.log(`Waiting 3 days before checking user state for: ${email}`);
    await context.sleep("wait-for-3-days", 60 * 60 * 24 * 3);

    while (true) {
      console.log(`Checking state for user: ${email}`);
      const state = await context.run("check-user-state", async () => {
        const userState = await getUserState(email);
        console.log(`User state for ${email}: ${userState}`);
        return userState;
      });

      if (state === "non-active") {
        await context.run("send-email-non-active", async () => {
          console.log(`Sending non-active email to: ${email}`);
          await sendEmail({
            email,
            subject: "Are you still there?",
            message: `Hey ${fullName}, we miss you!`,
          });
          return true;
        });
      } else if (state === "active") {
        await context.run("send-email-active", async () => {
          console.log(`Sending active user email to: ${email}`);
          await sendEmail({
            email,
            subject: "Welcome back!",
            message: `Welcome back ${fullName}!`,
          });
          return true;
        });
      }

      console.log(`Waiting 30 days before next check for: ${email}`);
      await context.sleep("wait-for-1-month", 60 * 60 * 24 * 30);
    }
  } catch (error) {
    console.error(`Error in onboarding workflow for ${email}:`, error);
    throw error; // Re-throw to ensure the workflow system handles it properly
  }
});
