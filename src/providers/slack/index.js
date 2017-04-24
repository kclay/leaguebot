export default Provider = {
    Users: function (robot) {
        return function (name) {
            return robot.brain.userForName(name);
        }
    },
    /**
     * @return {string}
     */
    Pattern: function (id, pattern) {
        let [command, trigger] = id.split('.');
        trigger = trigger === 'root' ? '' : ` ${trigger}`;

        return `!${command}${trigger}${pattern}`;

    },
    Checks: {
        isDM: function (robot, room) {
            return room[0] !== 'D'
        }
    },

}
