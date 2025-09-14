import { createServerFileRoute } from '@tanstack/react-start/server'
import { prisma } from '../utils/prisma'

export const ServerRoute = createServerFileRoute('/sitemap.xml_').methods({
    GET: async ({ request }) => {
        const baseUrl = 'https://mainefoodmap.org' // Update with your actual domain
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
})

// export const Route = createFileRoute('/sitemap.xml_')({
//     loader: async ({ context }) => {
//         // Get all restaurants for dynamic routes
//         const restaurants = await prisma.restaurants.findMany({
//             select: {
//                 slug: true,
//                 formatted_data_updated: true,
//             },
//             orderBy: {
//                 formatted_data_updated: 'desc',
//             },
//         })

//         // Get all categories
//         const categories = await prisma.categories.findMany({
//             select: {
//                 slug: true,
//             },
//             orderBy: {
//                 display_name: 'asc',
//             },
//         })

//         const baseUrl = 'https://mainefoodmap.com' // Update with your actual domain
//         const now = new Date().toISOString()

//         // Static routes
//         const staticRoutes = [
//             {
//                 url: `${baseUrl}/`,
//                 lastmod: now,
//                 changefreq: 'daily',
//                 priority: '1.0',
//             },
//             {
//                 url: `${baseUrl}/places`,
//                 lastmod: now,
//                 changefreq: 'daily',
//                 priority: '0.9',
//             },
//             {
//                 url: `${baseUrl}/posts`,
//                 lastmod: now,
//                 changefreq: 'weekly',
//                 priority: '0.7',
//             },
//         ]

//         // Dynamic restaurant routes
//         const restaurantRoutes = restaurants.map((restaurant) => ({
//             url: `${baseUrl}/places/${restaurant.slug}`,
//             lastmod: restaurant.formatted_data_updated?.toISOString() || now,
//             changefreq: 'weekly',
//             priority: '0.8',
//         }))

//         // // Category routes (if you have them)
//         // const categoryRoutes = categories.map((category) => ({
//         //     url: `${baseUrl}/categories/${category.slug}`,
//         //     lastmod: now,
//         //     changefreq: 'weekly',
//         //     priority: '0.6',
//         // }))

//         const allRoutes = [
//             ...staticRoutes,
//             ...restaurantRoutes,
//             // ...categoryRoutes
//         ]

//         // Generate XML sitemap
//         const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
// <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
// ${allRoutes
//                 .map(
//                     (route) => `  <url>
//     <loc>${route.url}</loc>
//     <lastmod>${route.lastmod}</lastmod>
//     <changefreq>${route.changefreq}</changefreq>
//     <priority>${route.priority}</priority>
//   </url>`
//                 )
//                 .join('\n')}
// </urlset>`

//         return {
//             sitemap,
//             headers: {
//                 'Content-Type': 'application/xml',
//                 'Cache-Control': 'public, max-age=86400', // Cache for 1 day
//             },
//         }
//     },
// })