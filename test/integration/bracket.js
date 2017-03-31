'use strict';

const Helper = require('hubot-test-helper');
const expect = require('chai').expect;
const http = require('http');
import {PermissionStorage} from "../../src/common";
import {Bracket} from "../../src/datastore";


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

        let bracket = await Bracket.findOne({
            where: {
                name: BRACKET
            }
        })
        bracket.name.should.equal(BRACKET);


    });

    it('should alert of existing bracket', async() => {
        await room.user.say(OWNER, `!bracket create ${BRACKET}`);
        await room.user.say(OWNER, `!bracket create ${BRACKET}`);
        room.messages.pop().should.deepEqual(
            ['hubot', `Error : There is already a bracket named ${BRACKET}!`]
        )
    })
   /*
    it('should display teams', async() => {
        await room.user.say(OWNER, `!bracket create ${BRACKET}`);
        await room.user.say(OWNER, `!bracket teams ${BRACKET}`);

        room.messages.pop().should.deepEqual(
            ['hubot', `Error : There is already a bracket named ${BRACKET}!`]
        )
    })  */


});




