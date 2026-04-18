import type { NextAuthConfig } from "next-auth";
import { NextResponse } from "next/server";

/**
 * Config compartida y compatible con Edge (middleware).
 * Los providers con DB viven solo en `auth.ts`.
 */
export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: {
    signIn: "/entrar",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? (token.sub as string);
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;

      if (
        pathname.startsWith("/api/auth") ||
        pathname === "/api/register"
      ) {
        return true;
      }

      if (auth?.user && pathname === "/portada") {
        return NextResponse.redirect(new URL("/", request.url));
      }

      if (
        pathname === "/entrar" ||
        pathname === "/registro" ||
        pathname === "/portada"
      ) {
        return true;
      }

      if (pathname.startsWith("/api/")) {
        if (!auth?.user) {
          return NextResponse.json(
            { error: "Tenés que iniciar sesión." },
            { status: 401 },
          );
        }
        return true;
      }

      if (!auth?.user) {
        const url = request.nextUrl.clone();
        url.pathname = "/portada";
        const dest = `${pathname}${request.nextUrl.search}`;
        url.searchParams.set("callbackUrl", dest === "/portada" ? "/" : dest);
        return NextResponse.redirect(url);
      }

      return true;
    },
  },
};
