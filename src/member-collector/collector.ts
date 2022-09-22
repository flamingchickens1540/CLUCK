
import { WebClient } from "@slack/web-api";
import { writeFileSync } from 'fs';
import { baseurl, slack_token } from "../../secrets/consts";
import { memberListFilePath, photosFilePath } from "../consts";
import { Member, SpreadsheetMemberInfo } from "../types";
import { configureDrive, getCertifications, getMemberInfo, updateProfilePictures } from "../api/spreadsheet";
import fs from 'fs'

function waitFor(conditionFunction) {
    const poll = resolve => {
        if(conditionFunction()) resolve();
        else setTimeout(() => poll(resolve), 100);
    }
    return new Promise(poll);
}


let members:Member[] = []
let collecting = false

const photos: {[key:string]:string} = {}
if (fs.existsSync(photosFilePath)) { 
    const messy_photos:{[key:string]:string} = JSON.parse(fs.readFileSync(photosFilePath, "utf-8")) 
    Object.entries(messy_photos).forEach(([key, value]) => {
        photos[tokenizeName(key)] = value
    })
}


const client = new WebClient(slack_token);

function tokenizeName(name:string):string {
    return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g,"").toLowerCase()
}

export const collect = async () => {
    
    if (collecting) { 
        await waitFor(() => !collecting)
        return
    }
    
    collecting = true
    try {
        await configureDrive()
        
        // Load slack users in the students group
        const userlist = await client.users.list()
        let slackUsers = userlist.members ?? []
        slackUsers = slackUsers.filter(elem => !elem.deleted )
        
        
        // Load Names from Spreadsheet
        let spreadsheetMember:SpreadsheetMemberInfo[]
        
        // Build members catalogue
        const slackMembers:Member[] = []
        const promises = slackUsers.map(async (user) => {
            if (user == null || user.real_name == null) return
            const name = user.real_name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            slackMembers[tokenizeName(user.real_name)] = ({
                name: name,
                firstname: name.split(" ")[0],
                img: user.profile.image_original
            })
        })
        // Run spreadsheet collection in parallel with slack collection
        promises.push(new Promise((resolve) => {getMemberInfo().then(membernames => {spreadsheetMember = membernames;resolve()})}))
        await Promise.all(promises)
        // For each spreadsheet user, add slack data
        members = []
        const certs = await getCertifications()
        spreadsheetMember.forEach(member=>{
            const name = member.name;
            let image:string;
            if (member.goodPhoto) {
                image = slackMembers[tokenizeName(name)]?.img ?? photos[tokenizeName(name)] ?? `${baseurl}/static/img/default_member.jpg`
            } else {
                image = photos[tokenizeName(name)] ?? `${baseurl}/static/img/default_member.jpg`
            }
            members.push({
                // if person is not in slack, generate default Member object
                name: name.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
                firstname: name.split(" ")[0],
                img: image,
                certs: member.certs.map((cert) => certs[cert])
            })
        })
        
        // Sort members alphabetically by name
        members.sort(function (a, b) {
            const aname = a.name.includes("Cynthia Yang") ? "Chloe Jahncke2" : a.name;
            const bname = b.name.includes("Cynthia Yang") ? "Chloe Jahncke2" :b.name;
            if (aname < bname) {
                return -1;
            }
            if (aname > bname) {
                return 1;
            }
            return 0;
        })
        
        writeFileSync(memberListFilePath, JSON.stringify(members, null, 4))
        updateProfilePictures()
    } finally {
        collecting = false
    }
}

export function getMembers():Member[] {
    return members
}


export default collect