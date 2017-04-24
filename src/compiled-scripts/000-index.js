'use strict';

module.exports = (robot) => {

    robot.receiveMiddleware((ctx, next, done) => {

        let resp = ctx.response;
        let user = resp.envelope.message.user;
        let id = resp.message.room;


        /* console.log(resp.envelope.message);
         console.log('client.users.get(user.name)');
         console.log(robot.client.users.get(user.id));
         console.log('brain.userForId');
         console.log(robot.brain.userForId(user.id))        */


        next();
    });


};


