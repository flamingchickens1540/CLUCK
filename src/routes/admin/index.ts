import { Hono } from 'hono'
import { router as member_route } from './members'
import { router as cert_route } from './certs'
import { router as membercert_route } from './membercerts'
import { router as meeting_route } from './meetings'
import { requireAdminLogin } from '~lib/auth'
import { trimTrailingSlash } from 'hono/trailing-slash'

export const router = new Hono()

router.get('/', (c) => c.text('admin'))
router.use(trimTrailingSlash())
router.use(requireAdminLogin)
router.route('/', member_route)
router.route('/', cert_route)
router.route('/', membercert_route)
router.route('/', meeting_route)

export default router
