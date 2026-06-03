import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, anonKey);

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://app.deeprastore.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sitemapEntries: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/collections`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // Fetch all real products
  const { data: products } = await supabase
    .from('products')
    .select('id, updated_at, created_at')
    .eq('is_test_data', false);

  if (products) {
    products.forEach((product) => {
      sitemapEntries.push({
        url: `${BASE_URL}/product/${product.id}`,
        lastModified: new Date(product.updated_at || product.created_at || new Date()),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });
  }

  // Fetch collections (categories)
  const { data: collections } = await supabase
    .from('collections')
    .select('slug, updated_at');

  if (collections) {
    collections.forEach((collection) => {
      sitemapEntries.push({
        url: `${BASE_URL}/collections?category=${collection.slug}`,
        lastModified: new Date(collection.updated_at || new Date()),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });
  }

  return sitemapEntries;
}
