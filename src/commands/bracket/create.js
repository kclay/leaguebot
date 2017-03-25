import BaseCommand from '../base';
import {Bracket} from '../../datastore';
import {PERMISSIONS, addPermissions}  from '../../common';


export  default class Create extends BaseCommand {

    static id = 'bracket.create';


    constructor(robot) {
        super(robot, Create.id);
    }

    init() {
        this._pattern = '\\s+(?<name>\\w+)';
        this._permission = 'SUPER_ADMIN | ADMIN';
        super.init();

    }

    async _handle(resp) {
        let {name} = resp.match.groups;


        let [bracket, created] = await Bracket.findOrCreate({
            where: {name: name}
        });

        if (created) {
            return resp.send(`${name} bracket has been created!`);
        } else {
            return resp.send(`There is already a bracket named ${name}!`);
        }

    }

}
