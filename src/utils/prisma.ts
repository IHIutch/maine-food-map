import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg'
import { withAccelerate } from '@prisma/extension-accelerate'


const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
function prismaClientSingleton() {
    return new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
        .$extends(withAccelerate())
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClientSingleton | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma
}