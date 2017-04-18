'use strict';

const Helper = require('hubot-test-helper');
const expect = require('chai').expect;
const http = require('http');
const should = require('should');
import {addPermissions, PermissionStorage} from "../../src/common";
import {Bracket, Schedule, Team, User} from "../../src/datastore";


const helper = new Helper('../../src/compiled-scripts/001-index.js'); // path to file you want to test

const USER_NAME = 'dummy_user';
const ID = '1';
const OWNER = 'bot-owner';
const BRACKET = 'test01';
let permissions;
describe('schedule', () => {

    let room;

    beforeEach(async () => {
        room = helper.createRoom({httpd: false});
        permissions = new PermissionStorage();
        room.robot.brain.set('permissions', permissions);

        let bracket = await Bracket.create({
            name: 'beginners'
        });

        await Team.bulkCreate([
            'Ankle Biters',
            'Evolved',
            'Karaoke Night',
            'Map\'o\'TassieMunchingMarsupials',
            'DEFY',
            'Whos this guy',
            'The Sh*tty Sh*ttys',
            'One Among the Fence'
        ].map((t) => {
            return {name: t, bracket_id: bracket.id}
        }))

    });
    afterEach(() => room.destroy());

    it('should import schedule', async () => {


        await room.user.say(OWNER, '!schedule import beginners 16Y07aaP70eFIAVembrkl9HHjwLTip4xpJSNVSexokEk');


        let matches = [
            [
                ['Ankle Biters', 'DEFY'],
                ['Evolved', 'Whos this guy'],
                ['Karaoke Night', 'The Sh*tty Sh*ttys'],
                ['Map\'o\'TassieMunchingMarsupials', 'One Among the Fence']
            ],
            [
                ['Ankle Biters', 'Evolved'],
                ['Karaoke Night', 'DEFY'],
                ['Map\'o\'TassieMunchingMarsupials', 'Whos this guy'],
                ['One Among the Fence', 'The Sh*tty Sh*ttys']
            ]
        ];

        const getSchedules = async (week) => {
            return await Schedule.findAll({
                where: {
                    week: week
                },
                include: [
                    {model: Team, as: 'HomeTeam'},
                    {model: Team, as: 'AwayTeam'}
                ]

            });
        };

        const check = (schedules, index) => {
            schedules.forEach(game => {
                let found = matches[index].find(a => {

                    return game.HomeTeam.name === a[0]
                        && game.AwayTeam.name === a[1];
                });
                let obj = {
                    week: game.week,
                    HomeTeam: game.HomeTeam.name,
                    AwayTeam: game.AwayTeam.name
                };
                should.exists(found, `No match for ${JSON.stringify(obj)}`);
            })
        };
        check(await getSchedules(1), 0);


        check(await getSchedules(2), 1);


    });

    it('should return upcoming game', async () => {

        const HOME_CAPTAIN = 'captain01';
        const AWAY_CAPTAIN = 'captain02';
        const HOME_TEAM = 'Ankle Biters';
        const AWAY_TEAM = 'DEFY';

        const createCaptainAndTeam = async (name, teamName, id) => {
            let captain = await User.create({
                name: name,
                _id: id
            });

            room.robot.brain.userForId(id, {
                id: id,
                name: name
            })
            let team = await Team.findOne({
                where: {
                    name: teamName
                }
            });

            await captain.update({
                permissions: addPermissions(captain.permissions, 'CAPTAIN').value
            });
            await team.addMember(captain.id, {
                is_captain: true
            });
            return [captain, team];
        };

        let [homeCaptain, homeTeam] = await createCaptainAndTeam(HOME_CAPTAIN, HOME_TEAM, 1);
        let [awayCaptain, awayTeam] = await createCaptainAndTeam(AWAY_CAPTAIN, AWAY_TEAM, 2);

        await room.user.say(OWNER, '!schedule import beginners 16Y07aaP70eFIAVembrkl9HHjwLTip4xpJSNVSexokEk');

        await room.user.say(HOME_CAPTAIN, '!schedule upcoming');


    })


});




