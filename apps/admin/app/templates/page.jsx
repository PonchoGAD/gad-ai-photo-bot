// apps/admin/app/templates/page.tsx
import { requireAdmin } from "@/lib/auth";
export default async function TemplatesPage() {
    requireAdmin();
    return (<div className="space-y-4">
      <h1 className="text-2xl font-bold">Templates</h1>
      <div className="border border-white/10 rounded p-4 bg-white/5">
        Сейчас список шаблонов отдаётся из <code>/api/templates</code>.  
        Следующий шаг — читать packs из packages/templates/packs.
      </div>
    </div>);
}
