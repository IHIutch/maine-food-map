// import { PrismaClient } from '@prisma/client/edge'
// import { withAccelerate } from '@prisma/extension-accelerate'
import { PrismaClient } from '../../generated/prisma/client';

import { PrismaPg } from '@prisma/adapter-pg'
// import { PrismaClient } from '@prisma/client'

const connectionString = `${process.env.DATABASE_URL}`

const adapter = new PrismaPg({ connectionString });
// const prisma = new PrismaClient({ adapter });

function prismaClientSingleton() {
    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
    // .$extends(withAccelerate())
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

// Remove query logging for now

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}