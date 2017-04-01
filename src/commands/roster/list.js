import BaseCommand from "../base";
import {Team, User} from "../../datastore";


export  default class List extends BaseCommand {

    static id = 'roster.list';
    help = {
        cmd: '!roster list <?team>',
        desc: 'Use this command to signup to a bracket'
    };


    constructor(robot) {
        super(robot, List.id);
    }


    init() {
        this._pattern = '\\s*(?<teamName>\\w+)?';
        super.init();
    }

    async _handle(resp) {
        let {teamName} =resp.match.groups;

        let team;

        if (!teamName) {
            let user = this.userResolve(resp);
            user = await User.findOne({
                where: {
                    _id: user.id
                }
            });

            const errorNotInTeam = () => {
                return resp.send(
                    this.text.error
                        .add('You are not part of a team so you must supply a team name.')
                        ._
                )
            };
            if (!user) {
                return errorNotInTeam();
            }

            team = await user.getTeam();

            if (!team) {
                return errorNotInTeam();
            }

            teamName = team.name;
        }

        if (!team) {
            team = await Team.byName(teamName);
        }

        if (!team) {
            return resp.send(
                this.text.error
                    .add('No team found by name')
                    .bold(teamName)._
            )
        }

        let members = team.getMembers();

        let captain = members.find(m => m.is_captain);

        let subs = members.filter(m => m.is_sub);

        members = members.filter(m => !m.is_captain && !m.is_sub);



    }

}
