import { PrismaClient } from '@prisma/client'
import { createUser } from '~lib/auth'
import logger from '~lib/logger'

const prisma = new PrismaClient()

async function main() {
    await createUser('zach', 'oneringtorulethemall', true, true)
}

await main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        logger.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
