import { queues } from "void/queues";

export type EmailMessage = { to: string; subject: string; text: string };

export function enqueueEmail(message: EmailMessage) {
  return queues.emails.send(message);
}
