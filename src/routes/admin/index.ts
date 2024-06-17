import { Hono } from 'hono'
import { router as member_route } from './members'
import { router as cert_route } from './certs'
import { router as membercert_route } from './membercerts'
export const router = new Hono()

router.get('/', (c) => c.text('admin'))
router.route('/', member_route)
router.route('/', cert_route)
router.route('/', membercert_route)

export default router
