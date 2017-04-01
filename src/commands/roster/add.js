import BaseCommand from "../base";
import {User} from "../../datastore";
import {addPermissions} from "../../common";


export  default class Add extends BaseCommand {

    static id = 'roster.add';

    help = {
        cmd: '!roster add <?sub> <name> <psn> <?twitch>',
        desc: 'Applies ADMIN or SUPER_ADMIN user role'
    };

    constructor(robot) {
        super(robot, Add.id);
    }

    init() {
        this._pattern = '\\s*(?<is_sub>sub)?\\s?@?(?<name>\\w+)\\s*(?<account>\\w+)?\\s*(?<twitch>\\S+)?';
        this._permission = 'CAPTAIN';
        super.init();

    }

    async _handle(resp) {


        let {is_sub, name, account, twitch} = resp.match.groups;
        let captain = this.brain.userForName(resp.envelope.user.name);

        captain = await User.findOne({
            where: {
                _id: captain.id
            }
        });

        let team = await captain.getTeam();

        if (!team) {
            return resp.send(this.text.error
                .add('Opps, this shouldn\'t have happened , sending to bot admin')._)
        }

        let teamMate = this.brain.userForName(name);

        if (!teamMate) {
            return resp.send(this.text
                .error.add('No user found with name').bold(name)._);
        }


        if (!account) {
            return resp.send(this.text
                .error.add('You must supply the user console account id.')._)
        }

        if (twitch) {
            twitch = twitch.trim();
            if (~twitch.indexOf('http')) {
                twitch = twitch.split('/').pop();
            }
        }

        let [user, created] = await User.findOrCreate({
            where: {
                _id: teamMate.id
            }
        });

        let currentTeam = await user.getTeam();

        if (currentTeam) {
            return resp.send(this.text
                .error.bold(teamMate.name)
                .add('is already a member of').bold(currentTeam.name)._);
        }

        let permissions = addPermissions(user.permissions, 'TEAM_MEMBER').value;
        user = await user.update({
            twitch: twitch,
            name: teamMate.name,
            account_name: account,
            permissions: permissions
        });

        this.permissions
            .update(user.id, permissions);

        is_sub = !!is_sub;

        await team.addMember(user.id, {
            is_sub: is_sub
        });

        return resp.send(
            this.text.bold(user.name)
                .add('has been added to')
                .bold(team.name)
                .add(is_sub ? `as a ${this.fmt.bold('sub')}` : '').e
        );


    }

}
