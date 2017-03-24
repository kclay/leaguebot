import Commands from '../../src/commands';
const should = require('should');

describe('commands', () => {


    it('should register command', () => {
        Commands.has('admin').should.be.true();
    });

    it('should retrieve admin command', () => {

        Commands.retrieve('admin').bang.should.eql('!admin');
    })

    it('should return trigger from main command', () => {
        let adminAdd = Commands.retrieve('admin').find('add');
        should.exists(adminAdd);
    })

    it('should return id of trigger', () => {
        let adminAdd = Commands.retrieve('admin').find('add');
        adminAdd.id.should.equal('admin.add');
    })

});