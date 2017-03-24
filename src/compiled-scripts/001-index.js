'use strict';

import {sequelize} from '../datastore';


import Commands from '../commands';

module.exports = (robot) => {
    console.log('001-index');
    sequelize.sync().then(() => {
        Object.keys(Commands.registry).forEach(key => {
            let command = Commands.registry[key];
            robot.logger.debug('Found command %s', key);
            command.mount(robot);
        })
    })


};


