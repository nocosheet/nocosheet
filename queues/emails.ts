import { defineQueue } from "void";
import { sendEmail } from "void/email";

import type { EmailMessage } from "@/lib/auth/mail";

export const maxRetries = 3;
export const retryDelay = 30;

export default defineQueue<EmailMessage>(async (batch) => {
  for (const msg of batch.messages) {
    try {
      const result = await sendEmail(msg.body);
      if (result.ok) {
        msg.ack();
        continue;
      }
      const reason =
        "error" in result
          ? `${result.error.code}: ${result.error.message}`
          : result.deliveries
              .filter((delivery) => !delivery.ok)
              .map((delivery) => `${delivery.recipient} ${delivery.error.code}`)
              .join(", ");
      console.error(`Email "${msg.body.subject}" failed (attempt ${msg.attempts}): ${reason}`);
    } catch (error) {
      console.error(`Email "${msg.body.subject}" threw (attempt ${msg.attempts}):`, error);
    }
    msg.retry({ delaySeconds: retryDelay });
  }
});
