import { createSessionClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/AdminHeader";
import type { Lead } from "@/lib/types/post";

export const revalidate = 0;

async function getLeads(): Promise<Lead[]> {
  try {
    const supabase = await createSessionClient();
    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    return (data as Lead[]) ?? [];
  } catch {
    return [];
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const STATUS_LABEL: Record<string, string> = {
  "Automações com IA":       "IA",
  "Agentes de IA internos":  "Agentes",
  "Integrações com n8n/APIs":"Integrações",
  "E-commerce":              "E-comm",
  "Site ou landing page":    "Site",
  "Ainda não sei":           "?",
};

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <>
      <AdminHeader
        title="Leads"
        description={`${leads.length} solicitações de diagnóstico recebidas`}
      />
      <div className="p-8 overflow-x-auto">
        {leads.length === 0 ? (
          <div className="bg-white border border-border p-12 text-center text-rc2-ebony/50 text-sm">
            Nenhum lead ainda.
          </div>
        ) : (
          <table className="w-full text-sm bg-white border border-border">
            <thead className="bg-zinc-50 border-b border-border">
              <tr>
                {["Nome", "Empresa", "E-mail", "WhatsApp", "Segmento", "Porte", "Solução", "Data"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-rc2-ebony/60 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-rc2-ebony whitespace-nowrap">{lead.name}</td>
                  <td className="px-4 py-3 text-rc2-ebony/80 whitespace-nowrap">{lead.company}</td>
                  <td className="px-4 py-3">
                    <a href={`mailto:${lead.email}`} className="text-rc2-orange hover:underline">{lead.email}</a>
                  </td>
                  <td className="px-4 py-3">
                    <a href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-rc2-orange hover:underline whitespace-nowrap">
                      {lead.whatsapp}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-rc2-ebony/80 whitespace-nowrap">{lead.segment}</td>
                  <td className="px-4 py-3 text-rc2-ebony/80 whitespace-nowrap">{lead.size}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 text-xs font-medium bg-rc2-orange/10 text-rc2-orange rounded">
                      {STATUS_LABEL[lead.solution] ?? lead.solution}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-rc2-ebony/50 whitespace-nowrap text-xs">{formatDate(lead.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
