const sqlite3 = require('sqlite3');
const path = require('path');
const fs = require('fs');
const util    = require('util')

var db = new sqlite3.Database('./data/config.db');

let get = (name) =>{
    return new Promise(resolve => db.get(`select * from config where name = '${name}'`, (err, data)=>{
        if(null != err){
            console.error(err);
            resolve(false);
        }
        resolve(data.value);
    }));
};

let set = async function(name, value){
    let check = await get(name);
    if(check === false){
        return new Promise(resolve => db.run(`insert into config values ('${name}', '${value}')`, resolve));
    }
    return new Promise(resolve => db.run(`update config set value = '${value}' where name = '${name}'`, resolve));
}

let getAll = () =>{
    return new Promise(resolve => db.all(`select * from config`, (err, data)=>{
        if(null != err){
            console.error(err);
            resolve(false);
        }
        resolve(data);
    }));
}

let init = async function(){
    
    let logPath = await get('logPath');

    let logFile = fs.createWriteStream(logPath+'log.txt', { flags: 'a' });
    let slogFile = fs.createWriteStream(logPath+'slog.txt', { flags: 'a' });
    let errorFile = fs.createWriteStream(logPath+'error.txt', { flags: 'a' });


    console.log = function() {
      logFile.write(util.format.apply(null, arguments) + '\n');
      process.stdout.write(util.format.apply(null, arguments) + '\n');
    }

    console.error = function() {
      errorFile.write(util.format.apply(null, arguments) + '\n');
      process.stderr.write(util.format.apply(null, arguments) + '\n');
    }
    console.slog = function() {
      slogFile.write(util.format.apply(null, arguments) + '\n');
    }

}
module.exports = { get,set,init,getAll };