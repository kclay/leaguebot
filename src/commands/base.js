const path = require('path');
const stackTrace = require('stack-trace');
import {Listener, Middleware} from 'hubot';
import {inspect} from 'util';

import {PERMISSIONS, PERMISSIONS_ALL, createLogger} from '../common';
const NamedRegExp = require('named-regexp-groups');


const TICKER = (cb) => {
    if (typeof setImmediate === "function") {
        return setImmediate(cb);
    } else {
        process.nextTick(cb)
    }
};
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
        this.robot.listeners.push(new AsyncListener(this.robot, this._matcher.bind(this),
            options, this._handle.bind(this)));
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


class AsyncListener extends Listener {


    call(message, middleware, cb) {
        let match;

        // middleware argument is optional
        if (cb == null && typeof middleware === 'function') {
            cb = middleware;
            middleware = undefined;
        }

        // ensure we have a Middleware object
        if (middleware == null) {
            middleware = new Middleware(this.robot);
        }

        if (match = this.matcher(message)) {
            if (this.regex) {
                this.robot.logger.debug(
                    `Message '${message}' matched regex /${inspect(this.regex)}/;
          listener.options = ${inspect(this.options)}`
                );
            }
            // special middleware-like function that always executes the Listener's
            // callback and calls done (never calls 'next')
            let executeListener = (context, done) => {
                this.robot.logger.debug(
                    'Executing listener callback for Message \'${message}\'');
                let p = Promise.resolve(true);
                let rtn;
                try {

                    p = Promise.resolve(this.callback(context.response));
                } catch (err) {
                    this.robot.emit('error', err, context.response);
                }
                p.then(() => {
                    return done();
                })

            };

            // When everything is finished (down the middleware stack and back up),
            // pass control back to the robot
            let allDone = () => {
                // Yes, we tried to execute the listener callback (middleware may
                // have intercepted before actually executing though)
                if (cb) {
                    TICKER(() => cb(true));
                }
            };

            let response = new this.robot.Response(this.robot, message, match);
            middleware.execute({
                listener: this,
                response,
            }, executeListener, allDone);
            return true;
        } else {
            if (cb) {
                // No, we didn't try to execute the listener callback
                process.nextTick(() => cb(false));
            }
            return false;
        }
    }

}
