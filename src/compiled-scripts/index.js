'use strict';

import {sequelize} from '../datastore';


import Commands from '../commands';

module.exports = (robot) => {
  sequelize.sync().then(() => {
    Object.keys(Commands.registry).forEach(key => {
      let command = Commands.registry[key];
      robot.logger.debug('Found command %s', key);
      command.mount(robot);
    })
  })


};


