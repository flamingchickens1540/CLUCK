
import { WebClient } from "@slack/web-api";
import { writeFileSync } from 'fs';
import { slack_token } from "../../secrets/consts";
import { getResourceURL, memberListFilePath, photosFilePath } from "../consts";
import { CluckMember } from "../types";
import { configureDrive, getCertifications, getMemberInfo, updateProfilePictures } from "../api/spreadsheet";
import fs from 'fs'
import { Member } from "@slack/web-api/dist/response/UsersListResponse";

function waitFor(conditionFunction) {
    const poll = resolve => {
        if(conditionFunction()) resolve();
        else setTimeout(() => poll(resolve), 100);
    }
    return new Promise(poll);
}


let members:CluckMember[] = []
let slackMembers:Member[] = []
let collecting = false

const photos: {[key:string]:string} = {}
if (fs.existsSync(photosFilePath)) { 
    const messyPhotos:{[key:string]:string} = JSON.parse(fs.readFileSync(photosFilePath, "utf-8")) 
    Object.entries(messyPhotos).forEach(([key, value]) => {
        photos[tokenizeName(key)] = value
    })
    photos[tokenizeName("Kevin Forbes")] = "https://res.cloudinary.com/veracross/image/upload/w_300,h_300,c_limit/v1663014175/catlin/person_photos/xkcfhq8fcqkzeyehyfgu.jpg"
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
        slackMembers = (await client.users.list()).members ?? []
        

        
        // Build members catalogue
        const slackMemberData:CluckMember[] = []
        slackMembers.filter((elem) => !elem.deleted).forEach((user) => {
            if (user == null || user.real_name == null) return
            const name = user.real_name.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            const displayName = user.profile.display_name_normalized.length > 0 ? user.profile.display_name_normalized : name
            slackMemberData[tokenizeName(user.real_name)] = {
                name: name,
                firstname: (displayName).split(" ")[0],
                img: user.profile.image_original
            }
        })
        // List spreadsheet users
        const spreadsheetMember = await getMemberInfo()
        
        // For each spreadsheet user, add slack data
        members = []
        const certs = await getCertifications()
        spreadsheetMember.forEach(member=>{
            const name = member.name;
            let image:string;
            if (member.goodPhoto) {
                image = slackMemberData[tokenizeName(name)]?.img ?? photos[tokenizeName(name)] ?? getResourceURL("/static/img/default_member.jpg", true)
            } else {
                image = photos[tokenizeName(name)] ?? getResourceURL("/static/img/default_member.jpg", true)
            }
            members.push({
                // if person is not in slack, generate default Member object
                name: name.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
                firstname: slackMemberData[tokenizeName(name)]?.firstname ?? name.split(" ")[0],
                img: image,
                certs: member.certs.map((cert) => certs[cert])
            })
        })
        
        // Custom sorting values to use
        const sortNames:{[key:string]:string} = {
            // "Cynthia": "Chloe"
        }        
        members.sort(function (a, b) {
            const aname = sortNames[a.firstname] ?? a.firstname;
            const bname = sortNames[b.firstname] ?? b.firstname;
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

export function getCluckMembers():CluckMember[] {
    return members
}
export function getSlackMembers():Member[] {
    return slackMembers
}


export default collect