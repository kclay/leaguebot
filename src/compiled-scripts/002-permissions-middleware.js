import {PERMISSIONS, hasAnyPermissions, createLogger, PermissionStorage} from '../common';

import {User} from '../datastore';

module.exports = (robot) => {

    let log = createLogger(robot.logger, 'middleware.permission');
    let permissions = new PermissionStorage();
    robot.brain.set('permissions', permissions);
    robot.listenerMiddleware(async(ctx, next, done) => {


        let listener = ctx.listener;
        let {id, permission, channel} = ctx.listener.options;


        let {user, room}= ctx.response.envelope;

        if (permission.has('USER')) {
            return next(done);
        }


        if (!permissions.exists(user.id)) {
            log.debug('In Memory user(%s) doesn\'t have the \'permission\' key... fetching from db', user.name);
            let found = await User.findOne({
                where: {
                    _id: user.id
                }
            });
            if (!found) {
                log.debug('No user found _id = %d name=%s', user.id, user.name);
                return done();
            }
            permissions.update(user.id, found.permissions);
            log.debug('Updating user permission in cache %s = %d', user.name, found.permissions);

        }

        let userPermissions = permissions.get(user.id);

        log.debug('Checking against %s permissions of (%s) permissions = %s',
            id, permission.key, userPermissions.key);

        if (PermissionStorage.hasAny_(userPermissions, permission)) {
            log.debug('User %s has permissions %s ', user.name, permission.key);
            next(done);
        } else {
            log.debug('User %s doesn\'t have any of the following permissions %s', user.name, permission.key);
            done();
        }


    });
};
