'use strict';

import {sequelize} from '../datastore';


import Commands from '../commands';

module.exports = (robot) => {

    console.log('001-index');
    const setup = () => {
        Object.keys(Commands.registry).forEach(key => {
            let command = Commands.registry[key];
            robot.logger.debug('Found command %s', key);
            command.mount(robot);
        })
    }
    if (process.env.NODE_ENV !== 'test') {
        sequelize.sync().then(setup)
    } else {
        setup();
    }


};


