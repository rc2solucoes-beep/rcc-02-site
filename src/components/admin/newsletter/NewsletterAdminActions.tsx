"use client";
import { useState, useTransition } from "react";
import { deleteNewsletterSubscriber, unsubscribeNewsletterSubscriber, type NewsletterActionResult } from "@/app/admin/(protected)/newsletter/actions";
const reasons = [{value:"titular_request",label:"Solicitação do titular"},{value:"bounce_or_complaint",label:"Falha de entrega ou reclamação"},{value:"other",label:"Outro motivo"}] as const;
type Reason = (typeof reasons)[number]["value"];
export function NewsletterAdminActions({ id, status }: { id: string; status: string }) {
  const [reason,setReason]=useState<Reason>("titular_request");
  const [confirmation,setConfirmation]=useState("");
  const [result,setResult]=useState<NewsletterActionResult|null>(null);
  const [pending,startTransition]=useTransition();
  function run(action:()=>Promise<NewsletterActionResult>){
    setResult(null);
    startTransition(async()=>{try{setResult(await action())}catch{setResult({ok:false,code:"failed"})}});
  }
  return <div className="space-y-5">
    {status!=="unsubscribed"&&<div className="space-y-2">
      <label htmlFor="nl-reason" className="block text-sm font-medium">Motivo do descadastro</label>
      <select id="nl-reason" value={reason} onChange={e=>setReason(e.target.value as Reason)} disabled={pending} className="border border-rc2-border bg-rc2-surface px-3 py-2 text-sm">
        {reasons.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}
      </select>
      <div><button type="button" disabled={pending} onClick={()=>run(()=>unsubscribeNewsletterSubscriber({id,reason}))} className="border border-rc2-border px-4 py-2 text-sm disabled:opacity-50">Descadastrar assinante</button></div>
    </div>}
    <div className="space-y-2 border-t border-rc2-border pt-4">
      <label htmlFor="nl-delete" className="block text-sm font-medium">Exclusão permanente — digite EXCLUIR para confirmar</label>
      <input id="nl-delete" value={confirmation} onChange={e=>setConfirmation(e.target.value)} autoComplete="off" disabled={pending} className="border border-rc2-border bg-rc2-surface px-3 py-2 text-sm"/>
      <div><button type="button" disabled={pending||confirmation!=="EXCLUIR"} onClick={()=>run(()=>deleteNewsletterSubscriber({id,confirmation}))} className="border border-rc2-error px-4 py-2 text-sm text-rc2-error disabled:opacity-50">Excluir permanentemente</button></div>
      <p className="text-xs text-rc2-text-secondary">A exclusão remove o cadastro e históricos associados; o registro administrativo de auditoria permanece.</p>
    </div>
    {result&&<p role={result.ok?"status":"alert"} aria-live="polite" className={result.ok?"text-sm text-rc2-text":"text-sm text-rc2-error"}>
      {result.ok?"Operação concluída.":result.code==="not_enabled"?"Administração ainda não habilitada.":result.code==="confirmation_invalid"?"Confirmação inválida.":result.code==="not_found"?"Assinante não encontrado.":"Não foi possível concluir a operação."}
    </p>}
  </div>;
}
