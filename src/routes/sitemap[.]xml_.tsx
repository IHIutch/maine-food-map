import { prisma } from '../utils/prisma'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/sitemap.xml_')({
    server: {
        handlers: {
            GET: async () => {
                const baseUrl = 'https://www.mainefoodmap.org' // Update with your actual domain
                const now = new Date().toISOString()

                const restaurants = await prisma.restaurants.findMany({
                    select: {
                        slug: true,
                        formatted_data_updated: true,
                    },
                    orderBy: {
                        formatted_data_updated: 'desc',
                    },
                })

                const restaurantRoutes = restaurants.map((restaurant) => ({
                    url: `${baseUrl}/places/${restaurant.slug}`,
                    lastmod: restaurant.formatted_data_updated?.toISOString() || now,
                    changefreq: 'weekly',
                    priority: '0.8',
                }))

                const allRoutes = [
                    ...restaurantRoutes
                ]

                const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
    <loc>${baseUrl}</loc>
</url>
${allRoutes.map((route) => `<url>
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
    }
})