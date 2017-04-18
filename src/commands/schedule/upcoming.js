import BaseCommand from "../base";
import {Schedule, sequelize, Series, Team, User} from "../../datastore";
const moment = require('moment-timezone');


export  default class Upcoming extends BaseCommand {

    static id = 'schedule.upcoming';
    help = {
        cmd: '!schedule upcoming',
        desc: 'Use this command to signup to a bracket'
    };


    constructor(robot) {
        super(robot, Upcoming.id);
    }


    init() {
        this._pattern = '';
        this._permission = 'TEAM_MEMBER | CAPTAIN';
        super.init();
    }


    async _handle(resp) {

        let user = await User.findOne({
            where: {
                _id: this.userResolveId(resp)
            }
        });


        let team = await user.getTeam();


        let upcoming = await Schedule.findOne({
            where: sequelize.literal('series.id IS NULL')

            ,
            order: 'week ASC',
            include: [
                {as: 'HomeTeam', model: Team},
                {as: 'AwayTeam', model: Team},
                {model: Series}
            ]
        })


        let [homeCaptain] = await upcoming.HomeTeam.getMembers({
            is_captain: true

        })
        let [awayCaptain] = await upcoming.AwayTeam.getMembers({
            is_captain: true

        });

        let isHome = upcoming.HomeTeam.id === team.id;

        let opponent = isHome ? 'away' : 'home';
        let opponentTeam = isHome ? upcoming.AwayTeam : upcoming.HomeTeam;
        let opponentCaptain = isHome ? awayCaptain : homeCaptain;

        let text = this.text.add(
            'Your next opponent is'
        ).bold(opponentTeam.name)
            .wrap(t => t.italic(`(@${opponentCaptain.name} - ${opponent})`), 'bold').e;

        let pretext;
        if (upcoming.date) {
            let time = moment(upcoming.date).tz(this.getTimezone(user._id))
                .format('MMM Do at H:mm zz');
            pretext = this.text.add('Your match is set for')
                .bold(time)._e.add('Be sure to checkin on the day of the match.')._
        }
        let fields = [];
        fields.push({
            title: 'Captain',
            value: `@${opponentCaptain.name}`,
            short: true
        });
        fields.push({
            title:'Field',
            value:opponent
        })

        let message = {
            attachments: [
                {
                    title: 'Your next opponent',
                    text: text,
                    pretext: pretext,
                }
            ]
        };

        // send to private message
        resp.envelope.message.room = resp.envelope.user.name;
        return resp.send(message);


    }

}
