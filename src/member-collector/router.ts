import { Router } from 'express'
import { memberListFilePath } from '../consts'
import collect from './collector'
import { readFileSync } from 'fs'
import { Member } from '../types'

export const router = Router()
// Member Collector

router.get('/members', (req, res) => { res.sendFile(memberListFilePath, { root: "." }) })

router.get('/members/picture', (req, res) => {
    const name = req.query.name as string
    if (name == null) { res.status(400).send("Must include name in query"); return }
    
    const members:Member[] = JSON.parse(readFileSync(memberListFilePath, 'utf-8'))
    const member = members.find(m => m.name == name)
    
    if (member == null) { res.status(400).send("Member not found"); return }

    res.send(member.img).end()
})

router.get('/members/refresh', async (req, res) => {
    await collect()
    res.sendFile(memberListFilePath, { root: "." })
})