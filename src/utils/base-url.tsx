const env = typeof window === 'undefined' ? import.meta.env : process.env

export const baseUrl = (() => {
    if (env.VITE_VERCEL_ENV === 'production' && env.VITE_VERCEL_PROJECT_PRODUCTION_URL) {
        return `https://${env.VITE_VERCEL_PROJECT_PRODUCTION_URL}`
    }

    if ((env.VITE_VERCEL_ENV === 'preview' || env.VITE_VERCEL_ENV === 'development') && env.VITE_VERCEL_URL) {
        return `https://${env.VITE_VERCEL_URL}`
    }

    return `http://localhost:${env.VITE_PORT}`
})()