const path = require('path');
const stackTrace = require('stack-trace');
import {Listener, Middleware} from "hubot";
import {inspect} from "util";
import {addPermissions, CHANNELS, CHANNELS_ALL, createLogger, PERMISSIONS, PERMISSIONS_ALL} from "../common";
import {AutoFormatter, TextBuilder} from "../formatters";
const NamedRegExp = require('named-regexp-groups');
const Promise = require('bluebird');


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
    _channel = CHANNELS_ALL;
    _enabled = true;
    log;
    _pattern = '';
    _fmt;


    constructor(robot, id) {
        this._id = id;
        this.robot = robot;
        this.log = createLogger(robot.logger, this.id);

        this.init();
        if (!this._fmt) {
            this._fmt = new AutoFormatter()

        }
        this.log.debug('Added %s Command', this.id);
        this._pattern = this._buildRegex();
    }


    userResolve(resp) {
        let name = typeof resp === 'string' ? resp : resp.envelope.user.name;
        return this.brain.userForName(name);
    }

    userResolveId(resp) {
        let user = this.userResolve(resp);
        return user && user.id ? '' + user.id : null;
    }

    /**
     * @return PermissionStorage
     */
    get permissions() {
        return this.brain.get('permissions');
    }

    addPermissions(current, toAdd) {
        return addPermissions(current, toAdd)
    }

    getTimezone(idOrName) {
        let user = this.userResolve(++idOrName);
        if (!user) user = this.brain.userForId(idOrName);

        if (user && user.slack.tz) {
            return user.slack.tz;
        }
        return 'America/Chicago';

    }

    get fmt() {
        return this._fmt;
    }

    get text() {
        return new TextBuilder(this._fmt);
    }

    get id() {
        return this._id;
    }

    init() {

        if (this._permission.constructor === String) {
            this._permission = PERMISSIONS.get(this._permission);
        }
        if (this._channel.constructor === String) {
            this._channel = CHANNELS.get(this._channel);
        }
        this.log.debug('Called init() for %s', this.id);
    }


    get brain() {
        return this.robot.brain;
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
        trigger = trigger === 'root' ? '' : ` ${trigger}`;

        let value = `!${command}${trigger}${this._pattern}`;
        this.log.debug('Creating matcher for %s = %s', this.id, value);
        return new NamedRegExp(value);
    }
}


class AsyncListener extends Listener {


    call(message, middleware, cb) {
        let match;

        // middleware argument is optional
        if (cb === null && typeof middleware === 'function') {
            cb = middleware;
            middleware = undefined;
        }

        // ensure we have a Middleware object
        if (middleware === null) {
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
                    `ASYNC Executing listener callback for Message \'${message}\'`);
                let p = Promise.resolve(true);
                let rtn;
                try {


                    p = Promise.resolve(this.callback(context.response));
                } catch (err) {
                    this.robot.emit('error', err, context.response);
                }
                p.then((v) => {
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
