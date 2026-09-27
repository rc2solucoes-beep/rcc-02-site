export interface OrgSettings {
  contact_email: string;
  whatsapp: string;
  phone: string;
  address: string;
  postal_code?: string;
  address_locality?: string;
  address_lat?: string | number;
  address_lng?: string | number;
  business_area: string;
  gmb_url: string;
  instagram_url: string;
  linkedin_url: string;
  facebook_url: string;
  youtube_url: string;
  og_image_url: string;
}

export interface WebPageInfo {
  title: string;
  description: string;
  url: string;
  keywords: string;
  image?: string;
}

// Schema.org types

/** Referência a uma entidade já declarada no grafo. */
export interface SchemaReference {
  "@id": string;
}

export interface ImageObject {
  "@type": "ImageObject";
  "@id": string;
  url: string;
}

export interface WebSite {
  "@context": "https://schema.org";
  "@type": "WebSite";
  "@id": string;
  name: string;
  url: string;
  publisher: SchemaReference;
}

/**
 * Área atendida: o país, tipado, ou um texto simples quando não há regra que
 * classifique o valor (Schema.org aceita `Text` em `areaServed`).
 */
export type AreaServed = { "@type": "Country"; name: string } | string;

export interface Organization {
  "@context": "https://schema.org";
  "@type": "Organization";
  "@id": string;
  name: string;
  url: string;
  logo: ImageObject;
  email?: string;
  telephone?: string;
  address?: {
    "@type": "PostalAddress";
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
  areaServed?: AreaServed[];
  sameAs?: string[];
  contactPoint?: {
    "@type": "ContactPoint";
    contactType: string;
    availableLanguage: string;
    url?: string;
    telephone?: string;
    email?: string;
  }[];
}

export interface WebPage {
  "@context": "https://schema.org";
  "@type": "WebPage";
  "@id": string;
  name: string;
  description: string;
  url: string;
  keywords?: string;
  image?: string;
  isPartOf: SchemaReference;
  publisher?: SchemaReference;
  mainEntity?: SchemaReference;
  breadcrumb?: SchemaReference;
}

/** Autor individual real de um post. Campos opcionais só existem com dado real. */
export interface Person {
  "@context": "https://schema.org";
  "@type": "Person";
  "@id": string;
  name: string;
  jobTitle?: string;
  image?: string;
  sameAs?: string[];
}

export interface BlogPosting {
  "@context": "https://schema.org";
  "@type": "BlogPosting";
  "@id": string;
  url: string;
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified: string;
  /** `#organization` (autoria institucional) ou `#person-{slug}`. */
  author: SchemaReference;
  publisher: SchemaReference;
  isPartOf: SchemaReference;
  mainEntityOfPage: SchemaReference;
}

export interface ListItem {
  "@type": "ListItem";
  position: number;
  name: string;
  /** Ausente no último item (a página corrente). */
  item?: string;
}

export interface BreadcrumbList {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  "@id": string;
  itemListElement: ListItem[];
}
