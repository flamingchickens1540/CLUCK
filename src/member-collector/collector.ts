
import { WebClient } from "@slack/web-api";
import { writeFileSync } from 'fs';
import { baseurl, slack_token } from "../../secrets/consts";
import { memberListFilePath } from "../consts";
import { Member } from "../types";
import { configureDrive, getMemberNames, updateProfilePictures } from "../api/spreadsheet";

function waitFor(conditionFunction) {
    const poll = resolve => {
        if(conditionFunction()) resolve();
        else setTimeout(() => poll(resolve), 100);
    }
    return new Promise(poll);
}


let members:Member[] = []
let collecting = false
const client = new WebClient(slack_token);

function tokenizeName(name:string):string {
    return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g,"")
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
        let names
        
        // Build members catalogue
        const slackMembers:Member[] = []
        const promises = slackUsers.map(async (user) => {
            if (user == null || user.real_name == null) return
            slackMembers[tokenizeName(user.real_name)] = ({
                name: user.real_name.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
                firstname: user.real_name.split(" ")[0],
                img: user.profile?.image_original ?? `${baseurl}/static/img/default_member.jpg`
            })
        })
        // Run spreadsheet collection in parallel with slack collection
        promises.push(new Promise((resolve) => {getMemberNames().then(membernames => {names = membernames;resolve()})}))
        await Promise.all(promises)
        // For each spreadsheet user, add slack data
        members = []
        names.forEach(name=>members.push(slackMembers[tokenizeName(name)] ?? ({
            // if person is not in slack, generate default Member object
            name: name.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
            firstname: name.split(" ")[0],
            img: `${baseurl}/static/img/default_member.jpg`
        })))
        
        
        // Sort members alphabetically by name
        members.sort(function (a, b) {
            if (a.name < b.name) {
                return -1;
            }
            if (a.name > b.name) {
                return 1;
            }
            return 0;
        })
        
        writeFileSync(memberListFilePath, JSON.stringify(members))
        updateProfilePictures()
    } finally {
        collecting = false
    }
}

export function getMembers():Member[] {
    return members
}


export default collect