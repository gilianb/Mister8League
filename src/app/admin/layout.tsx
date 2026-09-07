import { requireAdmin } from "@/lib/auth/session";
import AdminNav from "@/components/admin/AdminNav";
import Link from "next/link";
import "./admin.css";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="page-shell admin-workspace py-8 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
        <aside>
          <div className="lg:sticky lg:top-24">
            <div className="mb-5 hidden lg:block">
              <p className="kicker">Administration</p>
              <p className="mt-1 font-display text-2xl font-medium tracking-tight text-cream-100">La ligue, en coulisses</p>
            </div>
            <AdminNav />
            <Link href="/" className="mt-8 hidden text-[13px] text-cream-500 transition-colors hover:text-cream-100 lg:block">
              Revenir au site public
            </Link>
          </div>
        </aside>
        <div className="min-w-0 pb-8">{children}</div>
      </div>
    </div>
  );
}
