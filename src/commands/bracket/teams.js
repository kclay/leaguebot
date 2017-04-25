import BaseCommand from "../base";
import {Bracket} from "../../datastore";
const table = require('markdown-table');


export  default class Teams extends BaseCommand {

    static id = 'bracket.teams';


    constructor(robot) {
        super(robot, Teams.id);
    }


    init() {
        this._pattern = '\\s+(?<name>\\w+)';
        return super.init();
    }

    async _handle(resp) {
        let {name} = resp.match.groups;
        let bracket = await Bracket.findOne({
            where: {
                name: name
            }
        });

        if (!bracket) {
            return resp.send(this.text.error.add('Invalid bracket name!')._);
        }

        let teams = await bracket.getTeams();
        let table = this._fmt.table;

        let text = '';

        if (table) {

            text = table([
                ['Name', 'Points'],
                ...teams.map(t => [t.name, 1])
            ], {
                align: ['l', 'c']
            });
            console.log(text);
            text = '```md\n' + text + '\n```';
        } else {
            text = teams.map(t => `• ${t.name} - Points = 1`).join('\n');
        }


        return resp.send(this.text.add('Teams of').bold(bracket.name)
            .add('bracket\n')
            .add(text)._);

    }

}
