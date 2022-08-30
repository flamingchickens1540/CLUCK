
import { WebClient } from "@slack/web-api";
import { writeFileSync } from 'fs';

export type Member = {
    name: string;
    firstname: string;
    img: string;
}

export const collect = async (token) => {
    const client = new WebClient(token);

    // Load slack users in the students group
    let userlist = await client.usergroups.users.list({ usergroup: "S040BCAMCRF", include_disabled: false })
    let users = userlist.users

    // Build members catalogue
    let members:Member[] = []
    await Promise.all(users!.map(async (user_id) => {
        let user_response = await client.users.info({ user: user_id })
        let user = user_response.user!
        members.push({
            name: user.real_name!,
            firstname: user.real_name!.split(" ")[0],
            img: user.profile!.image_original ?? "/static/img/default_member.png"
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

    writeFileSync('member-collector/members.json', JSON.stringify(members))
}

export default collect