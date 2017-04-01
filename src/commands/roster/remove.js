import BaseCommand from "../base";
import {User} from "../../datastore";
import {removePermissions} from "../../common";


export  default class Remove extends BaseCommand {

    static id = 'roster.remove';
    help = {
        cmd: '!roster remove <username>',
        desc: 'Use this command to signup to a bracket'
    };


    constructor(robot) {
        super(robot, Remove.id);
    }


    init() {
        this._pattern = '\\s*@?(?<username>\\w+)';
        this._permission = 'CAPTAIN';
        super.init();
    }

    async _handle(resp) {
        let {username} =resp.match.groups;

        let user = this.userResolve(username);

        let captain = this.userResolve(resp);


        if (!user) {
            return resp.send(
                this.text.error
                    .add('User').bold(username)
                    .add('not found').e
            )
        }

        this.log.debug('Looking up user');

        user = await User.findOne({
            where: {
                _id: user.id
            }
        });


        if (!user) {
            this.log.debug('User not part of team')
            return resp.send(
                this.text.error
                    .bold(username)
                    .add('is not part of any teams').e
            )
        }

        this.log.debug('Fetching user team')
        let team = await user.getTeam();

        this.log.debug('Fetching captain instance')
        captain = await User.findOne({
            where: {
                _id: captain.id
            }
        });

        let canRemove = !!team;
        if (canRemove) {
            this.log.debug('User is part of team checking against captain team', captain);
            let captainTeam = await captain.getTeam();
            this.log.debug('Retrieved captain team', captainTeam.id, team.id);
            canRemove = captainTeam.id == team.id;
        }

        if (!canRemove) {
            this.log.debug('Not part of team');
            return resp.send(
                this.text.error
                    .add('Nice try, but you can\'t remove')
                    .bold(username)
                    .add('if they are not part of your team').e
            )
        }

        this.log.debug(`${username} is part of ${team.name} will remove`);
        await team.removeMember(user.id);

        let permissions = removePermissions(user.permissions, 'TEAM_MEMBER').value;

        this.permissions.update(user.id, permissions);

        await user.update({
            permissions: permissions
        });

        return resp.send(this.text.bold(username)
            .add('has been removed from').bold(team.name).e)


    }

}
