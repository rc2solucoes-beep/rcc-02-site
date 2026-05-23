import { z } from "zod";

// Step 1: Low-friction initial contact
export const contactStep1Schema = z.object({
  name:     z.string().trim().min(2, "Nome obrigatório"),
  email:    z.string().trim().email("E-mail inválido"),
  whatsapp: z.string().min(10, "WhatsApp obrigatório (com DDD)"),
  message:  z.string().trim().min(10, "Descreva seu desafio (mínimo 10 caracteres)"),
  website:  z.string().max(0, "Spam detectado").optional(),
});

export type ContactStep1Data = z.infer<typeof contactStep1Schema>;

// Step 2: Qualification details
export const contactStep2Schema = z.object({
  company:  z.string().trim().min(2, "Empresa obrigatória"),
  segment:  z.string().trim().min(2, "Segmento obrigatório"),
  size:     z.string().min(1, "Selecione o número de colaboradores"),
  solution: z.string().min(1, "Selecione uma solução"),
});

export type ContactStep2Data = z.infer<typeof contactStep2Schema>;

// Client form schema (no turnstileToken — handled server-side)
export const contactSchema = contactStep1Schema.merge(contactStep2Schema);
export type ContactFormData = z.infer<typeof contactSchema>;

// API schema used by the server route (adds optional turnstileToken)
export const contactApiSchema = contactSchema.extend({
  turnstileToken: z.string().optional().default(""),
});
export type ContactApiData = z.infer<typeof contactApiSchema>;
