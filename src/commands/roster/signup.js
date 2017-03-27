import BaseCommand from "../base";
import {Bracket, Team, User, sequelize} from "../../datastore";


export  default class Signup extends BaseCommand {

    static id = 'roster.signup';
    help = {
        cmd: '!roster signup <bracket> <name>',
        desc: 'Use this command to signup to a bracket'
    };


    constructor(robot) {
        super(robot, Signup.id);
    }


    init() {
        this._pattern = '\\s*(?<bracketName>\\w+)?\\s*(?<teamName>\\w+)?\\s*(?<captainName>\\w+)?';
        super.init();
    }

    async _handle(resp) {
        let {bracketName, teamName, captainName} =resp.match.groups;
        let brackets = await Bracket.findAll({
            order: [
                ['name', 'ASC']
            ]
        });

        if (!brackets.length) {
            return resp.send(this.text.error
                .add('No brackets available for signup.')._);
        }

        const errorInvalidBracket = () => {
            return resp.send(this.text
                .wrap((t) => {
                    return t.error.add('Must pass a bracket name of :')
                        .add(brackets.map((b) => this.fmt.bold(b.name)).join(', '))
                }, 'italic')._)
        };

        if (!bracketName) {
            return errorInvalidBracket();
        }

        let found = brackets.filter(b => b.name == bracketName);

        if (!found.length) {
            return errorInvalidBracket();
        }

        let bracket = found[0];

        if (!teamName) {
            return resp.send(this.text.error.add('Must pass a team name!')._);
        }

        let team = await sequelize
            .query('SELECT * from teams WHERE lower(name) = ?',
                {
                    replacements: [teamName.toLowerCase()],
                    type: sequelize.QueryTypes.SELECT
                }
            );

        if (team.length) {
            return resp.send(this.text.error.add('Sorry, there is already team by the name')
                .bold(teamName)._);
        }

        if (!captainName) {
            captainName = resp.envelope.user.name;
        }

        let user = this.brain.userForName(captainName);

        if (!user) {
            return resp.send(this.text
                .error.add('Invalid captain name').bold(captainName)._);
        }

        let work = sequelize.transaction(async(t) => {

            await sequelize.query('SET CONSTRAINTS ALL DEFERRED');

            let opts = {transaction: t};
            team = await Team.create({
                name: teamName
            }, opts);

            this.log.debug('Created team %j', team.toJSON());

            let [captain, created] = await User.findOrCreate({
                transaction: t,
                where: {
                    name: user.name
                }
            });

            let newPermissions = this.addPermissions(captain.permissions, 'CAPTAIN');

            this.log.debug('Setting CAPTAIN permissions for %s permissions = %', user.name, newPermissions)

            await captain.update({
                permissions: newPermissions.value
            }, opts);

            await team.addMember(captain, {
                transaction: t,
                is_captain: true
            }, opts);

            return bracket.addTeam(team.id, opts);
        });

        return work.then(() => {
            return resp.send(
                this.text.add('You have successfully added')
                    .bold(teamName).add('to').bold(bracketName)
                    .add('bracket with').bold(user.name)
                    .add('as the captain!')._
            );
        }).catch((e) => {
            console.log(e);
            this.log.error(e);
            return resp.send(this.text.error.add('Error with signing up your team!')._);
        })


    }

}
