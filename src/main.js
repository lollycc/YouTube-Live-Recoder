const config = require('./config');
const api = require('./api');
const recoder = require('./recorder');

config.init();

recoder.check();