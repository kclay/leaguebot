import {Formatter} from "./formatter";
const Provider = {

    Formatter: Formatter,
    Users: function (robot) {

        function normalize(user) {
            if (user) {
                user.name = user.username;
            }
            return user;
        }

        return {
            byName: function (name) {

                return normalize(
                    robot.client.users.find('username', name)
                );
            },
            byId: function (id) {
                return normalize(
                    robot.client.users.get(id)
                )

            }
        }
    },
    /**
     * @return {{dm: string, public: string}}
     */
    Pattern: function (id, pattern) {
        let [command, trigger] = id.split('.');
        trigger = trigger === 'root' ? '' : `-${trigger}`;

        return {
            dm: `!${command}${trigger}${pattern}`,
            public: `!league ${command}${trigger}${pattern}`
        }

    },
    Checks: {
        isDM: function (robot, id) {
            let channel = robot.client.channels.get(id);
            return channel && channel.type === 'dm';

        }
    }
};
export {
    Provider
}
export default Provider


