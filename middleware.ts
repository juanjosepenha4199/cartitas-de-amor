import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = new Set(["/entrar", "/registro", "/portada"]);

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.has(pathname)) return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname === "/api/register") return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });
  const loggedIn = !!token;

  if (pathname.startsWith("/api/")) {
    if (!loggedIn) {
      return NextResponse.json(
        { error: "Tenés que iniciar sesión." },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  if (!loggedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/portada";
    const dest = `${pathname}${request.nextUrl.search}`;
    url.searchParams.set("callbackUrl", dest === "/portada" ? "/" : dest);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
