require('babel-polyfill');
const datastore = require('../src/datastore');
beforeEach(done => {
    console.log('boot');
    datastore.sequelize.sync({force: true}).then(function () {
        done();
    });
});
