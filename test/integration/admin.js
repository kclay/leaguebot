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
let permissions;
describe('admin', () => {

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

    it('should add a new user as an admin', async() => {


        await room.user.say(OWNER, `!admin add ${USER_NAME}`);

        room.messages.pop().should.deepEqual(
            ['hubot', `${USER_NAME} has been added to the Admin list!`]
        );


    });


    it('should add a new user as an super admin', async() => {
        await room.user.say('bot-owner', `!admin add ${USER_NAME} super`);

        room.messages.pop().should.deepEqual(
            ['hubot', `${USER_NAME} has been added to the SuperAdmin list!`]
        );

    })

    it('should set permission correctly', async() => {
        await room.user.say(OWNER, `!admin add ${USER_NAME}`);
        await room.user.say(OWNER, `!admin add ${USER_NAME} super`);

        let permission = permissions.get(ID);

        permission.has('ADMIN').should.be.true();
        permission.has('SUPER_ADMIN').should.be.true();

        let user = await User.findOne({
            where: {_id: ID}
        });

        permission = PERMISSIONS.get(user.permissions);
        permission.has('ADMIN').should.be.true();
        permission.has('SUPER_ADMIN').should.be.true();
    })

});




