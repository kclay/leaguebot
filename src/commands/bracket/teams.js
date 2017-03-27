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

            return resp.send(this.text.error.add('Invalid bracket name!'));
        }


        let teams = await bracket.getTeams();


        let text = table([
                ['Name', 'Points']
            ].concat(teams.map(t => [t.name, 1])),
            {
                align: ['l', 'c']
            });
        let attachment = {
            title: `Teams of ${bracket.name} bracket.`,
            text: text,
            mrkdwn_in: ['text'],

        };
        let payload = {

            attachments: [attachment]

        };


        return resp.send(payload);


    }

}
