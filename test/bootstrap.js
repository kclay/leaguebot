require('babel-polyfill');
const datastore = require('../src/datastore');
beforeEach(done => {
    datastore.sequelize.sync({force: true}).then(function () {
        done();
    });
});
