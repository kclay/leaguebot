import BaseCommand from "../base";
import {Bracket} from "../../datastore";


export  default class List extends BaseCommand {

    static id = 'bracket.list';


    constructor(robot) {
        super(robot, List.id);
    }


    async _handle(resp) {
        let brackets = await Bracket.findAll({
            attributes: ['name'],
            order: [
                ['name', 'ASC']
            ]
        });

        if (!brackets.length) {
            return resp.send('No brackets created!');
        }

        let text = this.text
            .add('The following brackets are available bracket has been created\n');

        text.add(brackets.map((b) => text.fmt.bold(b.name)).join(', '));

        return resp.send(text._);


    }

}
