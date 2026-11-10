import { passkey } from "@better-auth/passkey";
import { APIError } from "better-auth/api";
import { admin, twoFactor } from "better-auth/plugins";
import { defineAuth } from "void/auth";
import { sendEmail } from "void/email";
import { storage } from "void/storage";

import { kvSecondaryStorage } from "./src/lib/auth-secondary-storage";
import { avatarKey, isAvatarUrl } from "./src/lib/avatar";
import { hasRole } from "./src/lib/roles";

const SIGNUP_DISABLED_MESSAGE = "Sign-up is disabled. Ask an administrator for access.";
const LAST_ADMIN_MESSAGE = "This is the last admin. Make someone else an admin first.";

export default defineAuth(({ defaults, env }) => ({
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
    get disableSignUp() {
      return !env.VITE_ENABLE_SIGNUP;
    },
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
        before: async (_user, ctx) => {
          if (!env.VITE_ENABLE_SIGNUP && !ctx?.path?.startsWith("/admin/")) {
            throw APIError.from("FORBIDDEN", {
              code: "SIGNUP_DISABLED",
              message: SIGNUP_DISABLED_MESSAGE,
            });
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
          if (isAvatarUrl(user.image)) await storage.delete(avatarKey(user.id));
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
