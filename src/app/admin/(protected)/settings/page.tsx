import { createSessionClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const revalidate = 0;

const SETTING_KEYS = [
  // Contato básico
  { key: "contact_email",  label: "E-mail de contato",    type: "email",  placeholder: "contato@rc2solucoes.com.br" },
  { key: "whatsapp",       label: "WhatsApp (só números)", type: "text",   placeholder: "5511988028550" },
  { key: "phone",          label: "Telefone (+55...)",     type: "tel",    placeholder: "+5511988028550" },

  // Localização
  { key: "address",        label: "Endereço completo",     type: "text",   placeholder: "Rua/Avenida, Nº, Bairro, São Paulo, SP" },
  { key: "address_lat",    label: "Latitude (Google Maps)", type: "number", placeholder: "-23.5505", step: "0.0001" },
  { key: "address_lng",    label: "Longitude (Google Maps)", type: "number", placeholder: "-46.6333", step: "0.0001" },
  { key: "business_area",  label: "Área de atuação",       type: "text",   placeholder: "São Paulo, SP ou Brasil" },

  // Redes e perfis
  { key: "instagram_url",  label: "URL do Instagram",      type: "url",    placeholder: "https://instagram.com/..." },
  { key: "linkedin_url",   label: "URL do LinkedIn",       type: "url",    placeholder: "https://linkedin.com/company/..." },
  { key: "facebook_url",   label: "URL do Facebook",       type: "url",    placeholder: "https://facebook.com/..." },
  { key: "youtube_url",    label: "URL do YouTube",        type: "url",    placeholder: "https://youtube.com/@..." },
  { key: "gmb_url",        label: "URL Google Business Profile", type: "url", placeholder: "https://www.google.com/maps/place/..." },

  // Imagem
  { key: "og_image_url",   label: "URL OG Image padrão",   type: "url",    placeholder: "/og-image.png" },
];

async function getSettings() {
  const supabase = await createSessionClient();
  const { data } = await supabase.from("settings").select("key,value");
  const map: Record<string, string> = {};
  (data ?? []).forEach(({ key, value }: { key: string; value: string }) => { map[key] = value; });
  return map;
}

async function saveSettings(formData: FormData) {
  "use server";
  const supabase = await createSessionClient();
  await Promise.all(
    SETTING_KEYS.map(({ key }) => {
      const value = (formData.get(key) as string) ?? "";
      return supabase.from("settings").upsert({ key, value }, { onConflict: "key" });
    })
  );
  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}

const inputBase = "w-full border border-border bg-rc2-sand px-3 py-2.5 text-sm text-rc2-ebony placeholder:text-rc2-ebony/40 outline-none focus:border-rc2-orange focus:ring-1 focus:ring-rc2-orange transition-colors";

type Props = {
  searchParams: Promise<{ saved?: string }>;
};

export default async function SettingsPage({ searchParams }: Props) {
  const settings = await getSettings();
  const { saved } = await searchParams;

  return (
    <>
      <AdminHeader title="Configurações" description="Dados gerais do site" />
      {saved === "1" && (
        <div className="mx-8 mt-4 px-4 py-3 bg-green-50 border border-green-200 text-green-800 text-sm rounded">
          ✓ Configurações salvas com sucesso.
        </div>
      )}
      <form action={saveSettings} className="p-4 md:p-6 lg:p-8 space-y-5 max-w-xl">
        {SETTING_KEYS.map(({ key, label, type, placeholder, step }: any) => (
          <div key={key}>
            <label htmlFor={key} className="block text-sm font-medium text-rc2-ebony mb-1.5">{label}</label>
            <input
              id={key} name={key} type={type}
              defaultValue={settings[key] ?? ""}
              placeholder={placeholder}
              step={step}
              className={inputBase}
            />
          </div>
        ))}

        <div className="pt-2">
          <button
            type="submit"
            className="px-8 h-11 bg-rc2-orange text-white font-semibold text-sm uppercase tracking-wide hover:bg-rc2-orange/90 transition-colors"
          >
            Salvar configurações
          </button>
        </div>
      </form>
    </>
  );
}
