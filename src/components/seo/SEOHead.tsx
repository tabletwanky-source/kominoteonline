import React, { useEffect } from 'react';

export interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
  structuredData?: Record<string, any> | Array<Record<string, any>>;
}

const DEFAULT_TITLE = 'Kominote Online | Kou ak Fòmasyon Pratik an Kreyòl';
const DEFAULT_DESCRIPTION = 'Aprann nouvo konpetans ak kou ak fòmasyon pratik an Kreyòl sou Kominote Online. Devlope konesans ou epi prepare tèt ou pou plis opòtinite.';
const DEFAULT_IMAGE = 'https://i.postimg.cc/hGb7Tk9s/kominotelogo.png';
const BASE_URL = 'https://kominote.online';

export const SEOHead: React.FC<SEOProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  image = DEFAULT_IMAGE,
  type = 'website',
  noindex = false,
  structuredData,
}) => {
  useEffect(() => {
    // 1. Document Title
    const finalTitle = title ? (title.includes('Kominote Online') ? title : `${title} | Kominote Online`) : DEFAULT_TITLE;
    document.title = finalTitle;

    // Helper to safely set or create meta tags
    const setMetaTag = (attrName: string, attrVal: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attrName, attrVal);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Helper to set link tags (like canonical)
    const setLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`);
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.setAttribute('href', href);
    };

    // 2. Standard Meta Tags
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');

    // 3. Canonical URL
    const finalCanonical = canonical 
      ? (canonical.startsWith('http') ? canonical : `${BASE_URL}${canonical}`) 
      : `${BASE_URL}${window.location.pathname}`;
    setLinkTag('canonical', finalCanonical);

    // 4. Open Graph Tags
    setMetaTag('property', 'og:title', finalTitle);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:image', image);
    setMetaTag('property', 'og:url', finalCanonical);
    setMetaTag('property', 'og:type', type);
    setMetaTag('property', 'og:site_name', 'Kominote Online');
    setMetaTag('property', 'og:locale', 'ht_HT');

    // 5. Twitter / X Card
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', finalTitle);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', image);

    // 6. JSON-LD Structured Data
    const scriptId = 'kominote-json-ld';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (structuredData) {
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.id = scriptId;
        scriptTag.type = 'application/ld+json';
        document.head.appendChild(scriptTag);
      }
      scriptTag.textContent = JSON.stringify(structuredData);
    } else if (scriptTag) {
      scriptTag.remove();
    }
  }, [title, description, canonical, image, type, noindex, structuredData]);

  return null;
};
