import BaseCommand from '../base';

export default class Users extends BaseCommand {
  static id = 'bot.users';

  constructor(robot) {
    super(robot, Users.id);
  }

  _handle(resp) {
    this.log.debug('%s', JSON.stringify(this.robot.brain.users()));
  }
}
