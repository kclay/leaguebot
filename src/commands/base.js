const path = require('path');
const stackTrace = require('stack-trace');
import {PERMISSIONS, PERMISSIONS_ALL, createLogger} from '../common';
const NamedRegExp = require('named-regexp-groups');


export default class BaseCommand {

    _id;
    _permission = PERMISSIONS_ALL;
    _channel;
    _enabled = true;
    log;
    _pattern = '';


    constructor(robot, id) {
        this._id = id;
        this.robot = robot;
        this.log = createLogger(robot.logger, this.id);
        this.init();

        this.log.debug('Added %s Command', this.id);
        this._pattern = this._buildRegex();
    }


    get id() {
        return this._id;
    }

    init() {

        if (this._permission.constructor === String) {
            this._permission = PERMISSIONS.get(this._permission);
        }
        this.log.debug('Called init() for %s', this.id);
    }


    get permissions() {
        return this.robot.brain.get('permissions');
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

