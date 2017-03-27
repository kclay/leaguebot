import BaseCommand from "../base";
import {Bracket} from "../../datastore";


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
            return resp.send(this.text.bold(name).add('bracket has been created!')._);
        } else {
            return resp.send(this.text.error
                .add(`There is already a bracket named ${this.fmt.bold(name)}!`)._);
        }

    }

}
