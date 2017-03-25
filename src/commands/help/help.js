import BaseCommand from '../base';
import {Bracket} from '../../datastore';
import {PERMISSIONS, addPermissions}  from '../../common';
import Commands from '../../commands';


export  default class Help extends BaseCommand {

    static id = 'help.root';


    constructor(robot) {
        super(robot, Help.id);
    }

    init() {
        this._pattern = '\\s*(?<name>.*)?';

        super.init();

    }

    async _handle(resp) {
        let {name} = resp.match.groups;
        let help, title;

        if (!~name.indexOf('.')) {
            return resp.send('Invalid command');
        }
        if (name) {
            name = name.trim();
            let [group, trigger] = name.split('.');
            let command = Commands.retrieve(group).find(trigger);
            if (!command) {
                return resp.send('No command found by the name of %s', name);
            }
            if (trigger == 'index') trigger = '';

            help = Help._buildHelp(command);
            title = `Command help for !${group} ${trigger}`;

        } else {


            let commands = Commands.list();
            this.log.debug('Found commands %s', commands);
            help = Help._buildHelp(commands);
            title = 'Using leaguebot';


        }
        this.log.debug('Help %s', help);


        let attachment = {
            title: title,
            text: help,
            mrkdwn_in: ['text'],

        };
        let payload = {
            text: 'Help',
            attachments: [attachment]

        };

        return resp.send(payload)

    }

    static _buildHelp(commands) {
        let single = false;
        if (!Array.isArray(commands)) {

            commands = [commands];
            single = true;
        }
        return commands
            .filter((c) => !!c.help)
            .map((c) => {
                if (single) {
                    return `*${c.help.cmd}* - _${c.help.desc}_`;
                }
                return `!help *${c.id}* - _${c.help.desc}_`

            }).join("\n");
    }

}
