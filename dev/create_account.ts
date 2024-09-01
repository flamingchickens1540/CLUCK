import { PrismaClient } from '@prisma/client'
import { createUser } from '~lib/auth'
import logger from '~lib/logger'

const prisma = new PrismaClient()

async function main() {
    await createUser(process.argv[2].trim(), process.argv[3].trim(), level[0], level[1])
}

const levels: Record<string, [boolean, boolean]> = {
    admin: [true, true],
    write: [true, false],
    read: [false, false]
}
console.log('-------')
if (process.argv.length < 5 || process.argv[2].length < 2 || process.argv[3].length < 2 || process.argv[4].length < 2) {
    console.log(process.argv)
    console.warn('!Missing arguments')
    process.exit(1)
}
const level = levels[process.argv[4].trim()]

if (levels[process.argv[4]] == null) {
    console.log(process.argv)
    console.warn('Invalid level')
    process.exit(1)
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
