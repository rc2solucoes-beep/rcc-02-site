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
export interface Organization {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
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
  areaServed?: {
    "@type": "City" | "Region" | "Country";
    name: string;
  }[];
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

export interface LocalBusiness {
  "@context": "https://schema.org";
  "@type": "LocalBusiness";
  name: string;
  url: string;
  logo: string;
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
  geo?: {
    "@type": "GeoCoordinates";
    latitude?: number | string;
    longitude?: number | string;
  };
  areaServed?: {
    "@type": "City" | "Region" | "Country";
    name: string;
  }[];
  sameAs?: string[];
}

export interface WebPage {
  "@context": "https://schema.org";
  "@type": "WebPage";
  name: string;
  description: string;
  url: string;
  keywords?: string;
  image?: string | { "@type": "ImageObject"; url: string };
  isPartOf?: {
    "@type": "WebSite";
    url: string;
    name: string;
  };
  publisher?: {
    "@type": "Organization";
    name: string;
    url: string;
    logo?: string;
  };
}

export interface BreadcrumbList {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: {
    "@type": "ListItem";
    position: number;
    name: string;
    item?: string;
  }[];
}
