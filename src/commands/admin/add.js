import BaseCommand from '../base';
import {User} from '../../datastore';
import {PERMISSIONS, addPermissions}  from '../../common';


export  default class Add extends BaseCommand {

    static id = 'admin.add';

    constructor(robot) {
        super(robot, Add.id);
    }

    init() {
        this._pattern = '\\s+(?<name>[@a-zA-Z]+)\\s?(?<asSuper>super)?';
        super.init();

    }

    async _handle(resp) {
        let {name, asSuper} = resp.match.groups;
        let type = asSuper ? 'SuperAdmin' : 'Admin';

        let u = this.robot.brain.userForName(name);
        if (!u) {

            return resp.send(`There is no user named ${name}!`);

        }

        let [user, created] = await User.findOrCreate({
            where: {_id: u.id}
        });

        let current = PERMISSIONS.get(user.permissions);

        let toAdd = (asSuper ? PERMISSIONS.SUPER_ADMIN : PERMISSIONS.ADMIN);


        if (current.has(toAdd)) {
            return resp.send(`${name} is already a part of the ${type} list!`);
        }

        let permissions = addPermissions(current, toAdd).value;


        await user.update({
            name: u.name,
            permissions: permissions
        });

        u.permissions = permissions;


        let msg = `${name} has been added to the ${type} list!`;
        resp.send(msg);
    }

}
