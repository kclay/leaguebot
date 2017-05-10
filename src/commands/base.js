const path = require('path');
const stackTrace = require('stack-trace');
import {Listener, Middleware} from "hubot";
import {inspect} from "util";
import {addPermissions, CHANNELS, CHANNELS_ALL, createLogger, PERMISSIONS, PERMISSIONS_ALL} from "../common";
import TextBuilder from "../core/builder";
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
    _provider;


    constructor(robot, id) {
        this._id = id;
        this.robot = robot;
        this.log = createLogger(robot.logger, this.id);

        this.init();

        this._fmt = new this.provider.Formatter();
        this._users = this.provider.Users(robot);


        this.log.debug('Added %s Command', this.id);
        this._pattern = this._buildRegex();
    }

    get provider() {
        return this.brain.get('provider');
    }


    userResolve(resp) {
        let name = typeof resp === 'string' ? resp : resp.envelope.user.name;
        return this._users.byName(name)
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


        let text = message.text || message.message && message.message.text;
        let isDM = this.provider.Checks.isDM(this.robot, message.room);
        let match;
        if (isDM && this._pattern.dm) {
            match = this._pattern.dm.exec(text);
        } else {
            match = this._pattern.public.exec(text);
        }


        if (match) {
            this.log.debug('Matched message %s with %j', text, match.groups);
        }
        return match;

    }


    _createPatterns() {
        return this.provider.Pattern(this.id, this._pattern);
    }

    _buildRegex() {
        let pattern = this._createPatterns();

        this.log.debug('Creating matcher for %s = %j', this.id, pattern);

        const regex = (value) => {
            if (!value) return null;
            if (pattern.flags) {
                return new NamedRegExp(value, pattern.flags)
            }
            return new NamedRegExp(value);
        };

        return {
            dm: regex(pattern.dm),
            public: regex(pattern.public)
        }

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
