import { requireAdmin } from "@/lib/auth/session";
import AdminNav from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <p className="text-[11px] tracking-[0.24em] text-gold-400 font-semibold">ADMINISTRATION · MISTER 8 TOURNAMENT LEAGUE</p>
        <AdminNav />
      </div>
      {children}
    </div>
  );
}
