'use strict';

const Helper = require('hubot-test-helper');
const expect = require('chai').expect;
const http = require('http');

const helper = new Helper('../../src/index.js'); // path to file you want to test

describe('hubot', () => {

    let room;

    beforeEach(() => room = helper.createRoom({httpd: false}));
    afterEach(() => room.destroy());

    it('should add a new user as an admin', (done) => {


        room.user.say('bot-owner', '!admin add newadmin')
            .then(a => {


                room.messages.pop().should.deepEqual(
                    ['hubot', 'newadmin has been added to the Admin list!']
                );


                done();
            });


    });

    it('should add a new user as an super admin', (done) => {
        room.user.say('bot-owner', '!admin add newadmin super')
            .then(() => {

                room.messages.pop().should.deepEqual(
                    ['hubot', 'newadmin has been added to the SuperAdmin list!']
                );
                done();
            })

    })

});




