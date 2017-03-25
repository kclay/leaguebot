'use strict';

const Helper = require('hubot-test-helper');
const expect = require('chai').expect;
const http = require('http');
import {PermissionStorage} from "../../src/common";

const helper = new Helper('../../src/compiled-scripts/001-index.js'); // path to file you want to test

const USER_NAME = 'dummy_user';
const ID = '1';
const OWNER = 'bot-owner';
const BRACKET = 'bracket01';
const BRACKET2 = 'bracket02';
let permissions;
describe('roster', () => {

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

    it('should return error for invalid bracket name', async() => {


        await room.user.say(OWNER, `!roster signup`);


        room.messages.pop().should.deepEqual([
            'hubot', 'Error : No brackets available for signup.'
        ]);

        await room.user.say(OWNER, `!bracket create ${BRACKET}`);

        await room.user.say(OWNER, `!roster signup ${BRACKET2}`);

        const invalidBracketError = [
            'hubot', `Error : Must pass a bracket name of : ${BRACKET}`
        ];
        room.messages.pop().should.deepEqual(invalidBracketError);


        await room.user.say(OWNER, `!roster signup ${BRACKET2} team01`);

        room.messages.pop().should.deepEqual(invalidBracketError);


    });

    it('should return error for no team name', async() => {
        await room.user.say(OWNER, `!bracket create ${BRACKET}`);
        await room.user.say(OWNER, `!roster signup ${BRACKET}`);
        room.messages.pop().should.deepEqual(
            ['hubot', `Error : Must pass a team name!`]
        )
    })


});




