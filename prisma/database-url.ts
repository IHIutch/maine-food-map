interface DatabaseEnvironment {
  DATABASE_URL?: string
  DIRECT_DATABASE_URL?: string
}

export function getDatabaseUrl(env: DatabaseEnvironment) {
  const url = env.DIRECT_DATABASE_URL || env.DATABASE_URL
  if (!url)
    throw new Error('Missing database connection URL')
  if (!/^postgres(?:ql)?:\/\//.test(url))
    throw new Error('A direct postgres:// or postgresql:// connection URL is required')
  return url
}
