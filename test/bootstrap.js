import {sequelize} from '../src/datastore';
beforeEach(done => {
    sequelize.sync({force: true}).then(function () {
        done();
    });
});