import {PERMISSIONS} from "./common";
require('dotenv').config();
export const Sequelize = require('sequelize');
const Promise = require('bluebird');

export const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS, {
        host: process.env.DB_HOST,
        dialect: 'postgres',

        pool: {
            max: 5,
            min: 0,
            idle: 10000
        }
    });


export const User = sequelize.define('user', {
    name: {
        type: Sequelize.STRING,
        field: 'name'
    },
    _id: {
        type: Sequelize.STRING,
        field: '_id'
    },
    destiny_id: {
        type: Sequelize.STRING
    },
    permissions: {
        type: Sequelize.INTEGER,
        defaultValue: PERMISSIONS.USER.value

    }
}, {underscored: true});

export const Config = sequelize.define('config', {
    league: {
        type: Sequelize.JSON
    }
});

export const Team = sequelize.define('team', {
    name: {
        type: Sequelize.STRING
    }
}, {underscored: true});

export const TeamMembers = sequelize.define('team_member', {
    is_captain: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    sub: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    }
}, {underscored: true});


Team.belongsToMany(User, {
    as: 'Members', through: TeamMembers,
    /*foreignKey: {
     name: 'team_id',
     deferrable: Sequelize.Deferrable.INITIALLY_DEFERRED
     } */
});


export const Bracket = sequelize.define('bracket', {
    name: {
        type: Sequelize.STRING
    }
}, {underscored: true});


Bracket.hasMany(Team, {as: 'Teams'});


export const Schedule = sequelize.define('schedule', {

    date: {
        type: Sequelize.DATE,
        allowNull: true
    },
    week: {
        type: Sequelize.INTEGER
    }


}, {underscored: true});

Team.hasOne(Schedule, {as: 'HomeTeam', foreignKey: 'home_team_id'});
Team.hasOne(Schedule, {as: 'AwayTeam', foreignKey: 'away_team_id'});


export const Series = sequelize.define('series', {
    id: {
        type: Sequelize.UUID,
        primaryKey: true
    }


}, {underscored: true});
Series.belongsTo(Schedule);
//Series.hasOne(Team, {as: 'winner', foreignKey: 'winning_team_id'});
//Series.hasOne(Team, {as: 'loser', foreignKey: 'losing_team_id'});


export const Reporting = sequelize.define('reporting', {
    id: {
        type: Sequelize.UUID,
        primaryKey: true
    }

}, {underscored: true});







