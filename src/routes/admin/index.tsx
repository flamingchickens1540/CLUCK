import { Hono } from 'hono'
import { router as member_route } from './members'
import { router as cert_route } from './certs'
import { router as membercert_route } from './membercerts'
import { router as meeting_route } from './meetings'
import { router as memberfield_route } from './memberfields'
import { requireAdminLogin } from '~lib/auth'
import { trimTrailingSlash } from 'hono/trailing-slash'
import { toTitleCase } from '~lib/util'

export const router = new Hono()

router.use(trimTrailingSlash())
router.use(requireAdminLogin)
router.route('/', member_route)
router.route('/', cert_route)
router.route('/', membercert_route)
router.route('/', meeting_route)
router.route('/', memberfield_route)

const pages = {
    members: ['Members', 'Add new members and sync slack accounts'],
    certs: ['Cert Setup', 'Create and edit cert names and levels'],
    membercerts: ['Cert Assignments', 'Manage certifications for team members'],
    meetings: ['Meetings', 'Record and view meeting attendance'],
    memberfields: ['Additional Fields', 'Add and edit additional fields for members to appear in the spreadsheet']
}

router.get('/', (c) => {
    return c.render(
        <div class="container h-screen mx-auto max-w-xl flex flex-col">
            <div class="flex-shrink mt-5">
                <h1 class="text-2xl font-bold">Admin</h1>
                <p>Welcome to the admin page, {toTitleCase(c.get('user'))}</p>
            </div>
            <div class="flex-grow flex-shrink flex flex-col justify-center align-middle">
                {Object.entries(pages).map(([path, [name, desc]], i) => (
                    <a href={'/admin/' + path} class="cursor-pointer w-full border rounded-xl shadow-md hover:shadow-lg hover:border-indigo-300 hover:shadow-indigo-300 transition-all duration-300 mt-5 block p-3" style={`z-index:${i}`}>
                        <span class="text-xl">{name}</span>
                        <p class="text-gray-500">{desc}</p>
                    </a>
                ))}
            </div>
        </div>
    )
})

export default router
