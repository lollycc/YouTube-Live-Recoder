const sqlite3 = require('sqlite3');

var channel = new sqlite3.Database('./config/channnel.db');

let getAll = () => {
    return new Promise(resolve => channel.all('select * from channel', (err, data)=>{
        if(null != err){
            console.log(err);
            resolve(false);
        }

        resolve(data);
    }));
}


module.exports = {
    getAll
}