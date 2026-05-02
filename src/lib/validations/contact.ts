import { z } from "zod";

export const contactSchema = z.object({
  name:     z.string().min(2, "Nome obrigatório"),
  company:  z.string().min(2, "Empresa obrigatória"),
  email:    z.string().email("E-mail inválido"),
  whatsapp: z.string().min(10, "WhatsApp obrigatório (com DDD)"),
  segment:  z.string().min(2, "Segmento obrigatório"),
  size:     z.string().min(1, "Selecione o número de colaboradores"),
  solution: z.string().min(1, "Selecione uma solução"),
  message:  z.string().min(10, "Descreva seu desafio (mínimo 10 caracteres)"),
  // Honeypot — deve estar vazio; robôs preenchem
  website:  z.string().max(0, "Spam detectado").optional(),
  // Turnstile token — obrigatório em produção
  turnstileToken: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;
