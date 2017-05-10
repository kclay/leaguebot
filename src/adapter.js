// Description:
//   Adapter for Hubot to communicate on Discord
//
// Commands:
//   None
//
// Configuration:
//   HUBOT_DISCORD_TOKEN          - authentication token for bot
//   HUBOT_DISCORD_STATUS_MSG     - Status message to set for "currently playing game"
//
// Notes:
//
let Adapter, EnterMessage, LeaveMessage, Robot, TextMessage, TopicMessage, User;
try {
    ({Robot, Adapter, EnterMessage, LeaveMessage, TopicMessage, TextMessage, User} = require('hubot'));
} catch (error) {
    let prequire = require('parent-require');
    ({Robot, Adapter, EnterMessage, LeaveMessage, TopicMessage, TextMessage, User} = prequire('hubot'));
}

let _ = require('lodash')
let Discord = require("discord.js");
let {TextChannel} = Discord;

//Settings
let currentlyPlaying = process.env.HUBOT_DISCORD_STATUS_MSG || '';

class DiscordBot extends Adapter {
    constructor(robot) {
        super(...arguments);
        this.ready = this.ready.bind(this);
        this.message = this.message.bind(this);
        this.disconnected = this.disconnected.bind(this);

        this.rooms = {};
        if (process.env.HUBOT_DISCORD_TOKEN === null) {
            this.robot.logger.error("Error: Environment variable named `HUBOT_DISCORD_TOKEN` required");

        }
    }

    run() {
        this.options =
            {token: process.env.HUBOT_DISCORD_TOKEN};

        this.client = new Discord.Client({
            autoReconnect: true,
            fetch_all_members: true,
            api_request_method: 'burst',
            ws: {compress: true, large_threshold: 1000}
        });
        this.robot.client = this.client;
        this.client.on('ready', this.ready);
        this.client.on('message', this.message);
        this.client.on('disconnected', this.disconnected);

        return this.client.login(this.options.token).catch(this.robot.logger.error);
    }


    ready() {
        this.robot.logger.info(`Logged in: ${this.client.user.username}#${this.client.user.discriminator}`);
        this.robot.name = this.client.user.username;
        this.robot.logger.info(`Robot Name: ${this.robot.name}`);
        this.emit("connected");

        //post-connect actions
        for (let channel of Array.from(this.client.channels)) {
            this.rooms[channel.id] = channel;
        }
        return this.client.user.setStatus('online', currentlyPlaying)
            .then(this.robot.logger.debug(`Status set to ${currentlyPlaying}`))
            .catch(this.robot.logger.error);
    }

    message(message) {
        // ignore messages from myself
        if (message.author.id === this.client.user.id) {
            return;
        }
        let user = this.robot.brain.userForId(message.author.id);
        user.room = message.channel.id;
        user.name = message.author.username;

        user.discriminator = message.author.discriminator;
        user.id = message.author.id;
        let guid = message.guild;
        if (guid && guid.members) {
            let member = guid.members.get(user.id);
            user.nickname = member.nickname;
            this.robot.logger.debug('Nickname %s = %s', user.name, user.nickname)


        }

        if (this.rooms[message.channel.id] === null) {
            this.rooms[message.channel.id] = message.channel;
        }

        let text = message.cleanContent;


        if (((message !== null ? message.channel : undefined) !== null) instanceof Discord.DMChannel) {
            if (!text.match(new RegExp(`^@?${this.robot.name}`))) {
                text = `${this.robot.name}: ${text}`;
            }
        }


        return this.receive(new TextMessage(user, text, message.id));
    }

    disconnected() {
        return this.robot.logger.info(`${this.robot.name} Disconnected, will auto reconnect soon...`);
    }

    send(envelope, ...messages) {
        return Array.from(messages).map((message) =>
            this.sendMessage(envelope.room, message));
    }

    reply(envelope, ...messages) {
        return Array.from(messages).map((message) =>
            this.sendMessage(envelope.room, `<@${envelope.user.id}> ${message}`));
    }

    sendMessage(channelId, message) {
        let errorHandle = err => robot.logger.error(`Error sending: ${message}\r\n${err}`);


        //Padded blank space before messages to comply with https://github.com/meew0/discord-bot-best-practices
        let zSWC = "\u200B";
        let options = {
            split: true
        }
        if (typeof message !== 'string') {

            options = _.defaults(message, options);
            message = message.text;
        }

        message = zSWC + message;

        let {robot} = this;

        robot.logger.debug('Message options = %j', options);
        let sendChannelMessage = function (channel, message) {
            let clientUser = __guard__(robot != null ? robot.client : undefined, x => x.user);
            let isText = (channel != null) && (channel.type === 'text');
            let permissions = isText && channel.permissionsFor(clientUser);

            let hasPerm = isText ? ((permissions != null) && permissions.hasPermission("SEND_MESSAGES")) : channel.type !== 'text';
            if (hasPerm) {
                return channel.sendMessage(message, options)
                    .then(msg => robot.logger.debug(`SUCCESS! Message sent to: ${channel.id}`)).catch(function (err) {
                        robot.logger.debug(`Error sending: ${message}\r\n${err}`);
                        if (process.env.HUBOT_OWNER) {
                            let owner = robot.client.users.get(process.env.HUBOT_OWNER);
                            return owner.sendMessage(`Couldn't send message to ${channel.name} (${channel}) in ${channel.guild.name}, contact ${channel.guild.owner}.\r\n${error}`)
                                .then(msg => robot.logger.debug(`SUCCESS! Message sent to: ${owner.id}`)).catch(err => robot.logger.debug(`Error sending: ${message}\r\n${err}`));
                        }
                    });
            } else {
                robot.logger.debug(`Can't send message to ${channel.name}, permission denied`);
                if (process.env.HUBOT_OWNER) {
                    let owner = robot.client.users.get(process.env.HUBOT_OWNER);
                    return owner.sendMessage(`Couldn't send message to ${channel.name} (${channel}) in ${channel.guild.name}, contact ${channel.guild.owner} to check permissions`)
                        .then(msg => robot.logger.debug(`SUCCESS! Message sent to: ${owner.id}`)).catch(err => robot.logger.debug(`Error sending: ${message}\r\n${err}`));
                }
            }
        };


        let sendUserMessage = (user, message) =>
            user.sendMessage(message, options)
                .then(msg => robot.logger.debug(`SUCCESS! Message sent to: ${user.id}`)).catch(err => robot.logger.debug(`Error sending: ${message}\r\n${err}`))
        ;


        //@robot.logger.debug "#{@robot.name}: Try to send message: \"#{message}\" to channel: #{channelId}"

        robot.logger.debug(`Looking up channel ${channelId} = %j`, this.rooms[channelId])
        if (this.rooms[channelId]) { // room is already known and cached
            return sendChannelMessage(this.rooms[channelId], message);
        } else { // unknown room, try to find it
            let channels = this.client.channels.filter(channel => channel.id === channelId);
            if (channels.first()) {
                return sendChannelMessage(channels.first(), message);
            } else if (this.client.users.get(channelId) !== null) {
                return sendUserMessage(this.client.users.get(channelId), message);
            } else {
                return this.robot.logger.debug(`Unknown channel id: ${channelId}`);
            }
        }
    }


    channelDelete(channel, client) {
        let roomId = channel.id;
        let user = new User(client.user.id);
        user.room = roomId;
        user.name = client.user.username;
        user.discriminator = client.user.discriminator;
        user.id = client.user.id;
        this.robot.logger.info(`${user.name}${user.discriminator} leaving ${roomId} after a channel delete`);
        return this.receive(new LeaveMessage(user, null, null));
    }

    guildDelete(guild, client) {
        let serverId = guild.id;
        let roomIds = (Array.from(guild.channels).map((channel) => channel.id));
        return (() => {
            let result = [];
            for (let room in rooms) {
                let user = new User(client.user.id);
                user.room = room.id;
                user.name = client.user.username;
                user.discriminator = client.user.discriminator;
                user.id = client.user.id;
                this.robot.logger.info(`${user.name}${user.discriminator} leaving ${roomId} after a guild delete`);
                result.push(this.receive(new LeaveMessage(user, null, null)));
            }
            return result;
        })();
    }
}


export function use(robot) {
    return new DiscordBot(robot);
}

function __guard__(value, transform) {
    return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}
