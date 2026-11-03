import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'PlateVision AI — Smart Nutrition & Macro Scanner',
    short_name: 'PlateVision',
    description: 'Instant AI food scanner. Calculate calories, protein, and macros from a photo in seconds.',
    start_url: '/app',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#FFFFFF',
    orientation: 'portrait',
    categories: ['health', 'fitness', 'lifestyle', 'food'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icons/icon-maskable-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    shortcuts: [
      {
        name: 'Scan Meal',
        url: '/app',
        description: 'Open AI scanner directly',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }]
      },
      {
        name: 'Nutrition Dashboard',
        url: '/app',
        description: 'View daily calorie and macro journal',
        icons: [{ src: '/icons/icon-192x192.png', sizes: '192x192' }]
      }
    ]
  };
}

