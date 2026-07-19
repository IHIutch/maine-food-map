export const seo = ({
  title,
  description,
  keywords,
  image,
  url,
}: {
  title: string
  description?: string
  keywords?: string
  image?: string
  url?: string
}) => {
  const tags = [
    { title },
    ...(description !== undefined
      ? [{ name: 'description', content: description }]
      : []),
    ...(keywords !== undefined
      ? [{ name: 'keywords', content: keywords }]
      : []),
    { name: 'twitter:title', content: title },
    ...(description !== undefined
      ? [{ name: 'twitter:description', content: description }]
      : []),
    { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: title },
    ...(description !== undefined
      ? [{ property: 'og:description', content: description }]
      : []),
    { property: 'og:site_name', content: 'Maine Food Map' },
    ...(url ? [{ property: 'og:url', content: url }] : []),
    ...(image
      ? [
        { name: 'twitter:image', content: image },
        { property: 'og:image', content: image },
      ]
      : []),
  ]

  return tags
}
