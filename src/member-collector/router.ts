import { Router } from 'express'
import { memberListFilePath } from '../consts'
import collect from './collector'

export const router = Router()
// Member Collector

router.get('/members', (req, res) => { res.sendFile(memberListFilePath, { root: "." }) })

router.get('/members/refresh', async (req, res) => {
    await collect()
    res.sendFile(memberListFilePath, { root: "." })
})