import { Hono } from 'hono'
import { router as member_route } from './member'
import { router as cert_route } from './cert'
export const router = new Hono()

router.get('/', (c) => c.text('admin'))
router.route('/', member_route)
router.route('/', cert_route)

export default router
