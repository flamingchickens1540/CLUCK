import { PrismaClient } from '@prisma/client'
import { createUser } from '~lib/auth'

const prisma = new PrismaClient()

async function main() {
    await createUser('zach', 'oneringtorulethemall', true, true)
}

await main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
