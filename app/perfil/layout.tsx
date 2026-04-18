import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function PerfilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/entrar?callbackUrl=/perfil");
  }
  return <>{children}</>;
}
