import { Hono } from 'hono'
import { router as membercert_route } from './membercerts'
import { router as meeting_route } from './attendance'
import { toTitleCase } from '~lib/util'

export const router = new Hono()

router.route('/', membercert_route)
router.route('/', meeting_route)

const pages = {
    members: ['Members', 'Add new members and sync slack accounts'],
    certs: ['Cert Setup', 'Create and edit cert names and levels'],
    membercerts: ['Cert Assignments', 'Manage certifications for team members'],
    attendance: ['Attendance', 'Record and view meeting attendance'],
    departments: ['Departments', 'Create and edit departments']
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
                    <a href={'/admin/' + path + '/'} class="cursor-pointer w-full border rounded-xl shadow-md hover:shadow-lg hover:border-indigo-300 hover:shadow-indigo-300 transition-all duration-300 mt-5 block p-3" style={`z-index:${i}`}>
                        <span class="text-xl">{name}</span>
                        <p class="text-gray-500">{desc}</p>
                    </a>
                ))}
            </div>
        </div>
    )
})

export default router
