import { passkeyClient } from "@better-auth/passkey/client";
import { adminClient, twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "void/client";

import { ac, roles } from "./access";

/** Void's preconfigured `auth` client has no plugin hook, so build ours with the plugins we use. */
export const auth = createAuthClient({
  basePath: "/api/auth",
  plugins: [passkeyClient(), twoFactorClient(), adminClient({ ac, roles })],
});
