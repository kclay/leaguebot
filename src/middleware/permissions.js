import {PERMISSIONS} from '../common';

import {User} from '../datastore';

export default function permissionMiddleware(robot) {

  robot.listenerMiddleware(async(ctx, next, done) => {

    let listener = ctx.listener;
    let {id, permission, channel} = ctx.listener.options;


    let {user, room}= ctx.response.envelope;

    let permissions = PERMISSIONS.get(permission);
    if (permission.is(PERMISSIONS)) {
      return next(done);
    }

    if (!('permissions' in user)) {
      let found = await User.findOne({
        where: {
          _id: user.id
        }
      });
      user.permissions = found.permissions;

    }


    robot.logger.debug('Checking permission for %s permission = %s',
      id, permissions.key);

    next()
  });
}

