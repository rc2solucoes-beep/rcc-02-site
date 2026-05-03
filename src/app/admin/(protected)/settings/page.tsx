import { createSessionClient } from "@/lib/supabase/server";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const revalidate = 0;

const SETTING_KEYS = [
  { key: "contact_email",  label: "E-mail de contato",    type: "email",  placeholder: "contato@rc2solucoes.com.br" },
  { key: "whatsapp",       label: "WhatsApp (só números)", type: "text",   placeholder: "5511988028550" },
  { key: "instagram_url",  label: "URL do Instagram",      type: "url",    placeholder: "https://instagram.com/..." },
  { key: "linkedin_url",   label: "URL do LinkedIn",       type: "url",    placeholder: "https://linkedin.com/company/..." },
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
  redirect("/admin/settings");
}

const inputBase = "w-full border border-border bg-rc2-sand px-3 py-2.5 text-sm text-rc2-ebony placeholder:text-rc2-ebony/40 outline-none focus:border-rc2-orange focus:ring-1 focus:ring-rc2-orange transition-colors";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <>
      <AdminHeader title="Configurações" description="Dados gerais do site" />
      <form action={saveSettings} className="p-8 space-y-5 max-w-xl">
        {SETTING_KEYS.map(({ key, label, type, placeholder }) => (
          <div key={key}>
            <label htmlFor={key} className="block text-sm font-medium text-rc2-ebony mb-1.5">{label}</label>
            <input
              id={key} name={key} type={type}
              defaultValue={settings[key] ?? ""}
              placeholder={placeholder}
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
