import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    username?: string;
  }
  interface Session {
    user: DefaultSession["user"] & { id: string; username: string };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
  }
}
