import {PERMISSIONS} from './common';
require('dotenv').config();
const Sequelize = require('sequelize');
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
});

export const Config = sequelize.define('config', {
  league: {
    type: Sequelize.JSON
  }
});

export const Team = sequelize.define('team', {
  name: {
    type: Sequelize.STRING
  }
});

export const TeamMembers = sequelize.define('team_members', {
  sub: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
});


Team.belongsToMany(User, {as: 'Members', through: TeamMembers});

export const Bracket = sequelize.define('bracket', {
  name: {
    type: Sequelize.STRING
  }
});

Bracket.hasMany(Team, {as: 'Teams'});


export const Schedule = sequelize.define('schedules', {
  team_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Team,
      key: 'id'
    }
  },
  opponent_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Team,
      key: 'id'
    }
  },
  date: {
    type: Sequelize.DATE,
    allowNull: true
  },
  week: {
    type: Sequelize.INTEGER
  },

});


export const Series = sequelize.define('series', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true
  }
});
Series.belongsTo(Schedule);

export const Reporting = sequelize.define('reporting', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true
  }

});







