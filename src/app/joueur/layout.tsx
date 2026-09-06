import { requireUser } from "@/lib/auth/session";
import JoueurNav from "./JoueurNav";

export const dynamic = "force-dynamic";

export default async function JoueurLayout({ children }: { children: React.ReactNode }) {
  await requireUser("/joueur");
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <JoueurNav />
      {children}
    </div>
  );
}
