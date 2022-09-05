
import { WebClient } from "@slack/web-api";
import { writeFileSync } from 'fs';
import { slack_token } from "../../secrets/consts";
import { memberListFilePath } from "../consts";
import { Member } from "../types";

const client = new WebClient(slack_token);

export const collect = async () => {
    

    // Load slack users in the students group
    const userlist = await client.usergroups.users.list({ usergroup: "S040BCAMCRF", include_disabled: false })
    const users = userlist.users ?? []

    // Build members catalogue
    const members:Member[] = []
    await Promise.all(users.map(async (user_id) => {
        const user_response = await client.users.info({ user: user_id })
        const user = user_response.user
        
        if (user == null || user.real_name == null) return
        members.push({
            name: user.real_name.normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
            firstname: user.real_name.split(" ")[0],
            img: user.profile?.image_original ?? "/static/img/default_member.png"
        })
    }))


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
}

export default collect