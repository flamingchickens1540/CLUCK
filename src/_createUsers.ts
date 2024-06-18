import { connectDatabase } from '@/lib/db'
import { createUser, validateLogin } from '@/lib/db/auth'

await connectDatabase()
await createUser('zach', 'oneringtorulethemall', true, true)
await createUser('lab', 'oneringtofindthem', true, false)
await createUser('kevin', 'oneringtobringthemall', true, true)
await createUser('reader', 'andinthedarknessbindthem', false, false)
