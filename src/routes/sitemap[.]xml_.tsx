import { createFileRoute } from '@tanstack/react-router'

import { baseUrl } from '../utils/env'
import { withDb } from '../utils/prisma'

export const Route = createFileRoute('/sitemap.xml_')({
  server: {
    handlers: {
      GET: async () => {
        const now = new Date().toISOString()

        const restaurants = await withDb(async db =>
          await db.orm.public.restaurants
            .select('slug', 'formatted_data_updated')
            .orderBy(restaurant => restaurant.formatted_data_updated.desc())
            .all(),
        )

        const restaurantRoutes = restaurants.map(restaurant => ({
          url: `${baseUrl}/places/${restaurant.slug}`,
          lastmod: restaurant.formatted_data_updated?.toString() || now,
          changefreq: 'weekly',
          priority: '0.8',
        }))

        const allRoutes = [
          ...restaurantRoutes,
        ]

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
    <loc>${baseUrl}</loc>
</url>
${allRoutes.map(route => `<url>
    <loc>${route.url}</loc>
  </url>`).join('\n')}
</urlset>`

        return new Response(sitemap, {
          headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, max-age=86400', // Cache for 1 day
          },
        })
      },
    },
  },
})
