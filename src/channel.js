/*
create table channel(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name varchar(20), 
    youtube varchar(30),
    twitcasting varchar(30),
    bilibili varchar(15),
    unique(name)
);
*/
const sqlite3 = require('sqlite3');

var db = new sqlite3.Database('./data/channel.db');

let getAll = () => {
    return new Promise(resolve => db.all('select * from channel', (err, data)=>{
        if(null != err){
            console.log(err);
            resolve(false);
        }

        resolve(data);
    }));
}

let add = (name, youtube, twitcasting, bilibili) => {
    if(!youtube) youtube = 'null';
    if(!twitcasting) twitcasting = 'null';
    if(!bilibili) bilibili = 'null';
    return new Promise(resolve => db.run(`insert into channel values(null, '${name}', '${youtube}', '${twitcasting}', '${bilibili}')`, resolve));
}

let del = (id)=>{
    return new Promise(resolve => db.run(`delete from channel where id = ${id}`, resolve));
}

let getName = (id)=>{
    return new Promise(resolve => db.get(`select name from channel where id = ${id}`, (err, data)=>{
        if(null != err){
            console.log(err);
            resolve(false);
        }
        if(data && data.name){
            resolve(data.name);
        }
        resolve(false);
    }));
}
module.exports = {
    getAll, add, del, getName
}