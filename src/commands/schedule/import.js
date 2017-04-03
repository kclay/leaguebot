import BaseCommand from "../base";
import {Team, Bracket, sequelize, Schedule} from "../../datastore";
const GoogleSpreadsheet = require('google-spreadsheet');
const csv = require('csv-stream');
const request = require('request');
const Promise = require('bluebird').noConflict();


export  default class Import extends BaseCommand {

    static id = 'schedule.import';
    help = {
        cmd: '!schedule import <bracket> <sheet_id>',
        desc: 'Use this command to signup to a bracket'
    };


    constructor(robot) {
        super(robot, Import.id);
    }


    init() {
        this._pattern = '\\s*(?<bracketName>\\w+)\\s*(?<sheetId>\\w+)';
        this._permission = 'BOT_OWNER | SUPER_ADMIN | ADMIN';
        super.init();
    }


    async getCSV(url) {
        const stream = csv.createStream({});
        let rows = [];
        return new Promise(function (resolve, reject) {

            request(url).pipe(stream)
                .on('error', err => {

                    reject(err)
                })
                .on('data', data => {
                    let cleaned = {};
                    Object.keys(data).forEach(v => {
                        cleaned[v.trim()] = (data[v] || '').trim();
                    });
                    rows.push(cleaned);

                })
                .on('end', () => {
                    resolve(rows);
                })
        })
    }

    async _handle(resp) {
        let {bracketName, sheetId} =resp.match.groups;

        let bracket = await Bracket.findOne({
            where: {
                name: bracketName
            }
        });

        if (!bracket) {
            this.log.debug('Could not find bracket');

            return resp.send(this.text.error
                .bold(bracketName).add('was not found').e)
        }

        let doc = new GoogleSpreadsheet(sheetId);
        let info;
        const getInfo = Promise.promisify(doc.getInfo);
        try {
            info = await getInfo();
        } catch (e) {
            this.log.error(e);
            return resp.send(this.text.error
                .add('Unable to view the sheet, make sure its public and use File->Publish to Web').e)
        }


        let weeks = await Promise.map(info.worksheets, async(sheet) => {
            let url = sheet._links['http://schemas.google.com/spreadsheets/2006#exportcsv']


            return await this.getCSV(url)
        });

        await resp.send(this.text.wrap(t => t.bold('Importing....'), 'italic')._);
        let teamNames = {};

        weeks.forEach(week => {
            week.forEach(game => {
                game.Home = game.Home.toLowerCase().trim();
                game.Away = game.Away.toLowerCase().trim();
                teamNames[game.Home] = true;
                teamNames[game.Away] = true;
            })
        });
        teamNames = Object.keys(teamNames);
        let teams = await Team.findAll({
            where: sequelize.where(
                sequelize.fn('lower', sequelize.col('name')),
                {$any: teamNames}
            )
        });
        if (teams.length != teamNames.length) {

            let foundNames = teams.map(team => team.name.toLowerCase());
            let missing = teamNames.filter(name => {
                return !foundNames.find(name)
            });
            return resp.send(this.text.error
                .add('Was unable to find a few teams:')
                .italic(missing.map(this.fmt.bold).join(', ')).e);
        }
        // TODO check bracket
        let teamsByName = {};
        teams.forEach(team => {

            teamsByName[team.name.toLowerCase()] = team;
        });


        await Promise.each(weeks, async(week) => {
            let games = week.map(game => {

                let entry = {
                    home_team_id: teamsByName[game.Home].id,
                    away_team_id: teamsByName[game.Away].id,
                    bracket_id: bracket.id,
                    week: parseInt(game.Week, 10)
                };

                return entry;
            });

            return await Schedule.bulkCreate(games)


        });


        return weeks;


    }

}
