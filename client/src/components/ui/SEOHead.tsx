import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: string;
}

export function SEOHead({
  title = 'Alma Lectora | Librería Curada y Accesorios',
  description = 'Descubrí la mejor selección de libros, velas aromáticas, separadores y accesorios para tu lectura en Alma Lectora.',
  ogImage = '/web-app-manifest-512x512.png',
  ogType = 'website',
}: SEOHeadProps) {
  useEffect(() => {
    // 1. Update Title
    document.title = title;

    // 2. Helper to set or create meta tag
    const setMetaTag = (selector: string, keyName: string, keyValue: string, contentValue: string) => {
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(keyName, keyValue);
        document.head.appendChild(element);
      }
      element.setAttribute('content', contentValue);
    };

    setMetaTag('meta[name="description"]', 'name', 'description', description);
    setMetaTag('meta[property="og:title"]', 'property', 'og:title', title);
    setMetaTag('meta[property="og:description"]', 'property', 'og:description', description);
    setMetaTag('meta[property="og:image"]', 'property', 'og:image', ogImage);
    setMetaTag('meta[property="og:type"]', 'property', 'og:type', ogType);
  }, [title, description, ogImage, ogType]);

  return null;
}

export default SEOHead;
