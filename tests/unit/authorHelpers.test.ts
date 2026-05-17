import { describe, expect, it } from "vitest";
import {
  hasAuthorSnapshotChanged,
  mapAuthorToPostSnapshot,
  mapPostSnapshotToAuthorPayload,
} from "@/lib/authors/mappers";
import { AuthorSchema, normalizeOptionalUrl } from "@/lib/validations/author";

describe("author helpers", () => {
  it("maps an Author record into post snapshot fields", () => {
    const snapshot = mapAuthorToPostSnapshot({
      id: "11111111-1111-1111-1111-111111111111",
      name: "Ada Lovelace",
      title: "Mathematician",
      photo_url: "https://example.com/ada.jpg",
      bio: "First programmer",
      linkedin_url: "https://linkedin.com/in/ada",
      created_at: "2026-05-17T00:00:00.000Z",
      updated_at: "2026-05-17T00:00:00.000Z",
    });

    expect(snapshot).toEqual({
      author_id: "11111111-1111-1111-1111-111111111111",
      author_name: "Ada Lovelace",
      author_title: "Mathematician",
      author_photo: "https://example.com/ada.jpg",
      author_bio: "First programmer",
      author_linkedin: "https://linkedin.com/in/ada",
    });
  });

  it("maps post snapshot fields into an author update payload", () => {
    expect(
      mapPostSnapshotToAuthorPayload({
        author_name: "Ada Lovelace",
        author_title: "Mathematician",
        author_photo: "",
        author_bio: "First programmer",
        author_linkedin: "",
      })
    ).toEqual({
      name: "Ada Lovelace",
      title: "Mathematician",
      photo_url: null,
      bio: "First programmer",
      linkedin_url: null,
    });
  });

  it("detects when the local snapshot diverges from the selected author", () => {
    const author = {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Ada Lovelace",
      title: "Mathematician",
      photo_url: null,
      bio: null,
      linkedin_url: null,
      created_at: "2026-05-17T00:00:00.000Z",
      updated_at: "2026-05-17T00:00:00.000Z",
    };

    expect(
      hasAuthorSnapshotChanged(author, {
        author_name: "Ada Lovelace",
        author_title: "Mathematician",
        author_photo: "",
        author_bio: "",
        author_linkedin: "",
      })
    ).toBe(false);

    expect(
      hasAuthorSnapshotChanged(author, {
        author_name: "Ada Lovelace",
        author_title: "Principal Consultant",
        author_photo: "",
        author_bio: "",
        author_linkedin: "",
      })
    ).toBe(true);
  });

  it("normalizes optional URLs and validates Author payloads", () => {
    expect(normalizeOptionalUrl("")).toBeNull();

    const parsed = AuthorSchema.parse({
      name: "Ada Lovelace",
      title: "Mathematician",
      photo_url: "",
      bio: "First programmer",
      linkedin_url: "https://linkedin.com/in/ada",
    });

    expect(parsed.photo_url).toBeNull();
    expect(parsed.linkedin_url).toBe("https://linkedin.com/in/ada");
  });

  it("normalizes whitespace-only optional title and bio values to null", () => {
    const parsed = AuthorSchema.parse({
      name: "Ada Lovelace",
      title: "   ",
      bio: "\n\t  ",
    });

    expect(parsed.title).toBeNull();
    expect(parsed.bio).toBeNull();
  });
});
