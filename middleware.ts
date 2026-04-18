import NextAuth from "next-auth";

import { authConfig } from "@/auth.config";

/** Misma resolución de sesión que `auth()` en servidor (evita bucles con `getToken`). */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
