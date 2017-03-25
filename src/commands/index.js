const path = require('path');
const BaseCommand = require('./base');
const glob = require('glob');


class Commands {

    registry = {};

    constructor() {

    }

    add(name, trigger, command) {
        let cmd = this.registry[name] ? this.registry[name] : this.registry[name] = new Command(name);

        console.log('Adding command %s with trigger %s', name, trigger);
        cmd.add(trigger, command);
    }


    list(group) {
        const flatten = arr => arr.reduce(
            (acc, val) => acc.concat(
                Array.isArray(val) ? flatten(val) : val
            ),
            []
        );
        if (group && !(group in this.registry)) {
            return [];
        }

        let commands = group
            ? [this.registry[group]]
            : Object.values(this.registry);


        return flatten(commands.map(c => {

            return Object.values(c.mounted)
        }));

    }


    retrieve(name) {
        return this.registry[name];
    }


    has(name) {
        return !!this.registry[name];
    }
}

class Command {

    triggers = {};
    name;

    mounted = {};

    constructor(name) {
        this.name = name;

    }


    get bang() {
        return `!${this.name}`;
    }

    canHandle(bang) {
        return bang === this.bang;
    }


    mount(robot) {
        robot.logger.debug(`Mounting ${this.bang}`);
        Object.keys(this.triggers).forEach(trigger => {
            let clazz = this.triggers[trigger];

            let instance = new clazz(robot);
            instance.mount();
            this.mounted[trigger] = instance;
        })

    }

    find(name) {
        return this.mounted[name];
    }

    add(trigger, command) {
        console.log('Added trigger (%s) to !%s', trigger, this.name);
        this.triggers[trigger] = command;
    }

    handle() {

    }


}
const Repo = new Commands();

glob.sync(`${__dirname}/**/*.js`).forEach(file => {


    let triggerName = path.basename(file, '.js');

    let match = file.match(/commands\/(.*)\//i);

    if (!match)return;
    let name = match[1];
    let command = require(path.resolve(file));
    if (command.prototype instanceof BaseCommand) {
        Repo.add(name, triggerName, command);
    }
});

export default Repo;
