/*
create table history(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id INTEGER,
    type varchar(10),
    vid varchar(15),
    title TEXT,
    start_time BIGINT,
    end_time BIGINT,
    status INTEGER
);
*/

const sqlite3 = require('sqlite3');

var db = new sqlite3.Database('./data/history.db');


let recordStart = (channelId, type, vid, title, startTime)=>{
    return new Promise(resolve => db.run(`insert into history values(null, '${channelId}', '${type}', '${vid}', '${title}', '${startTime}', 0, 0)`, resolve));
}

let recordEnd = (channelId, startTime)=>{
    endTime = Date.now();
    return new Promise(resolve => db.run(`update history set end_time = ${endTime} where channel_id  = ${channelId} and start_time = ${startTime}`, resolve));
}
let setStopSign = (channelId, startTime)=>{
    return new Promise(resolve => db.run(`update history set status = 1 where channel_id  = ${channelId} and start_time = ${startTime}`, resolve));
}
let getLast = (channelId) => {
    return new Promise(resolve => db.get(`select * from history where channel_id = ${channelId} order by start_time desc`, (err, data)=>{
        if(null != err){
            console.log(err);
            resolve(false);
        }

        resolve(data);
    }));
}
module.exports = {
    recordStart, recordEnd, getLast,setStopSign
}