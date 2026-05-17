import { z } from "zod";

export function normalizeOptionalUrl(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? null : trimmed;
}

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? null : trimmed;
}

const optionalTextSchema = (maxLength: number, message?: string) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      return normalizeOptionalText(value);
    },
    z.string().max(maxLength, message).nullable().optional()
  );

const optionalUrlSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    return normalizeOptionalUrl(value);
  },
  z.string().url().nullable().optional()
);

export const AuthorSchema = z.object({
  name: z.string().trim().min(1, "Nome do autor é obrigatório").max(255),
  title: optionalTextSchema(255),
  photo_url: optionalUrlSchema,
  bio: optionalTextSchema(500, "Mini bio: máx 500 caracteres"),
  linkedin_url: optionalUrlSchema,
});

export type AuthorInput = z.infer<typeof AuthorSchema>;
