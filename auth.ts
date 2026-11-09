import { passkey } from "@better-auth/passkey";
import { APIError } from "better-auth/api";
import { admin, twoFactor } from "better-auth/plugins";
import { defineAuth } from "void/auth";
import { sendEmail } from "void/email";
import { storage } from "void/storage";

import { kvSecondaryStorage } from "./src/lib/auth-secondary-storage";
import { avatarKeyFromUrl } from "./src/lib/avatar";
import { hasRole } from "./src/lib/roles";

const LAST_ADMIN_MESSAGE = "This is the last admin. Make someone else an admin first.";

export default defineAuth(({ defaults }) => ({
  ...defaults,
  secondaryStorage: kvSecondaryStorage,
  rateLimit: { ...defaults.rateLimit, storage: "secondary-storage" },
  plugins: [
    ...(defaults.plugins ?? []),
    passkey({ rpName: "Nocosheet" }),
    twoFactor({ issuer: "Nocosheet" }),
    admin(),
  ],
  emailAndPassword: {
    ...defaults.emailAndPassword,
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your Nocosheet password",
        text: `Hi ${user.name},\n\nUse the link below to reset your password:\n${url}\n\nIf you did not request this, you can ignore this email.`,
      });
    },
  },
  databaseHooks: {
    user: {
      create: {
        // First-run setup: the very first account becomes the admin. It is also marked verified so
        // setup works before outgoing email is configured.
        before: async (user, ctx) => {
          const existing = await ctx?.context.adapter.count({ model: "user" });
          if (existing === 0) {
            return { data: { ...user, role: "admin", emailVerified: true } };
          }
        },
      },
      update: {
        before: async (data, ctx) => {
          // Only the admin endpoints carry a target user id in the body.
          const userId = ctx?.path?.startsWith("/admin/") ? ctx.body?.userId : undefined;
          if (!userId || !ctx) return;
          const target = await ctx.context.internalAdapter.findUserById(userId);
          if (!target) return;

          if (data.role !== undefined && hasRole(target, "admin") && !hasRole(data, "admin")) {
            const admins = await ctx.context.adapter.count({
              model: "user",
              where: [{ field: "role", operator: "contains", value: "admin" }],
            });
            if (admins <= 1)
              throw APIError.from("BAD_REQUEST", {
                code: "LAST_ADMIN",
                message: LAST_ADMIN_MESSAGE,
              });
          }

          // Removing a photo through the admin API must also free the stored file.
          if (data.image === null) {
            const key = avatarKeyFromUrl(target.image);
            if (key) await storage.delete(key);
          }
        },
      },
      delete: {
        before: async (user, ctx) => {
          if (!ctx || !hasRole(user, "admin")) return;
          const admins = await ctx.context.adapter.count({
            model: "user",
            where: [{ field: "role", operator: "contains", value: "admin" }],
          });
          if (admins <= 1)
            throw APIError.from("BAD_REQUEST", { code: "LAST_ADMIN", message: LAST_ADMIN_MESSAGE });
        },
        after: async (user) => {
          const key = avatarKeyFromUrl(user.image);
          if (key) await storage.delete(key);
        },
      },
    },
  },
  user: {
    ...defaults.user,
    changeEmail: {
      enabled: true,
      // Approval link goes to the CURRENT address; the new address is verified after approval.
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        await sendEmail({
          to: user.email,
          subject: "Approve your Nocosheet email change",
          text: `Hi ${user.name},\n\nWe received a request to change your email to ${newEmail}. Approve it with the link below:\n${url}\n\nIf you did not request this, you can ignore this email and your address will stay the same.`,
        });
      },
    },
    deleteUser: { enabled: true },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your Nocosheet email",
        text: `Hi ${user.name},\n\nConfirm your email address using the link below:\n${url}\n\nIf you did not create an account, you can ignore this email.`,
      });
    },
  },
}));
