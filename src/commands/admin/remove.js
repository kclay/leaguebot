import BaseCommand from '../base';
import {User} from '../../datastore';
import {PERMISSIONS, removePermissions}  from '../../common';


export  default class Remove extends BaseCommand {

    static id = 'admin.remove';

    constructor(robot) {
        super(robot, Remove.id);
    }

    init() {
        this._pattern = '\\s+@?(?<name>\\w+)';
        super.init();

    }

    async _handle(resp) {
        let {name} = resp.match.groups;


        let u = this.robot.brain.userForName(name);
        if (!u) {

            return resp.send(`There is no user named ${name}!`);

        }

        let user = await User.findOne({
            where: {_id: u.id}
        });


        if (user) {
            let current = PERMISSIONS.get(user.permissions);

            this.log.debug('Current Permissions %j', current);

            let updated = removePermissions(current, PERMISSIONS.get('SUPER_ADMIN | ADMIN'));
            this.log.debug('Updating %s permission from %s to %s', user.name, current, updated);
            await user.update({
                permissions: updated.value
            });


            this.permissions.update(u.id, updated.value);
            this.log.debug('Updating user permission in cache %s = %d', u.name, updated.value);

        }


        let msg = `${name} has been added removed as an admin!`;
        return resp.send(msg);

    }

}
