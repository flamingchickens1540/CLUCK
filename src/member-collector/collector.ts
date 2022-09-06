
import { WebClient } from "@slack/web-api";
import { writeFileSync } from 'fs';
import { slack_token } from "../../secrets/consts";
import { memberListFilePath } from "../consts";
import { Member } from "../types";
import { configureDrive, getMemberNames, updateProfilePictures } from "../api/spreadsheet";

const client = new WebClient(slack_token);

function tokenizeName(name:string):string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g,"")
}

export const collect = async () => {
    await configureDrive()

    // Load slack users in the students group
    const userlist = await client.usergroups.users.list({ usergroup: "S040BCAMCRF", include_disabled: false })
    const slackUsers = userlist.users ?? []

    // Load Names from Spreadsheet
    const names: string[] = await getMemberNames()

    // Build members catalogue
    const slackMembers:Member[] = []
    await Promise.all(slackUsers.map(async (user_id) => {
        const user_response = await client.users.info({ user: user_id })
        const user = user_response.user
        
        if (user == null || user.real_name == null) return
        slackMembers[tokenizeName(user.real_name)] = ({
            name: user.real_name.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
            firstname: user.real_name.split(" ")[0],
            img: user.profile?.image_original ?? "/static/img/default_member.jpg"
        })
    }))

    // For each spreadsheet user, add slack data
    const members:Member[] = []
    names.forEach(name=>members.push(slackMembers[tokenizeName(name)] ?? ({
            // if person is not in slack, generate default Member object
            name: name.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
            firstname: name.split(" ")[0],
            img: "/static/img/default_member.jpg"
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
    updateProfilePictures(members)
}

export default collect