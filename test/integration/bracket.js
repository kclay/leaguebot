'use strict';

const Helper = require('hubot-test-helper');
const expect = require('chai').expect;
const http = require('http');
import {PermissionStorage, PERMISSIONS} from '../../src/common';
import {User} from '../../src/datastore';

const helper = new Helper('../../src/compiled-scripts/001-index.js'); // path to file you want to test

const USER_NAME = 'dummy_user';
const ID = '1';
const OWNER = 'bot-owner';
const BRACKET = 'test01';
let permissions;
describe('bracket', () => {

    let room;

    beforeEach(() => {
        room = helper.createRoom({httpd: false});
        permissions = new PermissionStorage();
        room.robot.brain.set('permissions', permissions);
        room.robot.brain.userForId(ID, {
            id: ID,
            name: USER_NAME
        })
    });
    afterEach(() => room.destroy());

    it('should create bracket', async() => {


        await room.user.say(OWNER, `!bracket create ${BRACKET}`);

        room.messages.pop().should.deepEqual(
            ['hubot', `${BRACKET} bracket has been created!`]
        );


    });

    it('should alert of existing bracket', async() => {
        await room.user.say(OWNER, `!bracket create ${BRACKET}`);
        await room.user.say(OWNER, `!bracket create ${BRACKET}`);
        room.messages.pop().should.deepEqual(
            ['hubot', `There is already a bracket named ${BRACKET}!`]
        )
    })


});




