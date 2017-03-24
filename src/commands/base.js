const path = require('path');
const stackTrace = require('stack-trace');
const NamedRegExp = require('named-regexp-groups');


export default class BaseCommand {

    _id;
    _permission;
    _channel;
    _enabled = true;
    log;
    _pattern = '';


    constructor(robot, id) {
        this._id = id;
        this.robot = robot;
        this.log = this._createLogger(robot.logger);
        this.init();

        this.log.debug('Added %s Command', this.id);
        this._pattern = this._buildRegex();
    }

    _createLogger(logger) {

        let banner = this.id;

        function bind(type) {
            return function () {
                let parts = Array.prototype.slice.call(arguments);
                parts[0] = `[${banner}] ${parts[0]}`;

                logger[type].apply(logger, parts);

            }
        }

        return {
            debug: bind('debug'),
            info: bind('info'),
            warning: bind('warning'),

            error: bind('error')
        }
    }

    get id() {
        return this._id;
    }

    init() {
        this.log.debug('Called init() for %s', this.id);
    }


    mount() {

        const options = {
            id: this._id,
            permission: this._permission,
            channel: this._channel
        };

        this.log.debug('Mounting %s Command with options = %j', this.id, options);
        this.robot.listen(this._matcher.bind(this), options, this._handle.bind(this))
    }

    unmount() {

    }

    _handle(response) {

    }

    _matcher(message) {

        if (!this._enabled) {

            return false;
        }


        let text = message.text;


        let match = this._pattern.exec(text);
        if (match) {
            this.log.debug('Matched message %s with %j', text, match.groups);
        }
        return match;

    }


    _buildRegex() {
        let [command, trigger] = this.id.split('.');
        let value = `!${command} ${trigger}${this._pattern}`;
        this.log.debug('Creating matcher for %s = %s', this.id, value);
        return new NamedRegExp(value);
    }
}

