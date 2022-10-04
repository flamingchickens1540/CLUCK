
import { WebClient } from "@slack/web-api";
import { writeFileSync } from 'fs';
import { slack_token } from "../../secrets/consts";
import { getResourceURL, memberListFilePath, photosFilePath } from "../consts";
import { Member } from "../types";
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
    const messyPhotos:{[key:string]:string} = JSON.parse(fs.readFileSync(photosFilePath, "utf-8")) 
    Object.entries(messyPhotos).forEach(([key, value]) => {
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
        
        
        // Build members catalogue
        const slackMembers:Member[] = []
        slackUsers.forEach((user) => {
            if (user == null || user.real_name == null) return
            const name = user.real_name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            const displayName = user.profile.display_name_normalized.length > 0 ? user.profile.display_name_normalized : name
            slackMembers[tokenizeName(user.real_name)] = {
                name: name,
                firstname: (displayName).split(" ")[0],
                img: user.profile.image_original
            }
        })
        // Run spreadsheet collection in parallel with slack collection
        const spreadsheetMember = await getMemberInfo()
        
        // For each spreadsheet user, add slack data
        members = []
        const certs = await getCertifications()
        spreadsheetMember.forEach(member=>{
            const name = member.name;
            let image:string;
            if (member.goodPhoto) {
                image = slackMembers[tokenizeName(name)]?.img ?? photos[tokenizeName(name)] ?? getResourceURL("/static/img/default_member.jpg", true)
            } else {
                image = photos[tokenizeName(name)] ?? getResourceURL("/static/img/default_member.jpg", true)
            }
            members.push({
                // if person is not in slack, generate default Member object
                name: name.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
                firstname: slackMembers[tokenizeName(name)]?.firstname ?? name.split(" ")[0],
                img: image,
                certs: member.certs.map((cert) => certs[cert])
            })
        })
        
        // Sort members alphabetically by name
        const sortNames:{[key:string]:string} = {
            "Cynthia Yang": "Chloe Jahncke1"
        }
        members.push({
            name: 'Clay SMP',
            firstname: 'Clay',
            img: getResourceURL("/static/img/clay.png", true),
            certs: []
        })
        
        members.sort(function (a, b) {
            const aname = sortNames[a.name] ?? a.name;
            const bname = sortNames[b.name] ?? b.name;
            return aname.localeCompare(bname, "en-us", {
                sensitivity:"base"
            })
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