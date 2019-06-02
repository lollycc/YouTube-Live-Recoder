const express=require('express');
const bodyParser = require('body-parser');
const config = require('./config');
const channel = require('./channel');
const recorder = require('./recorder');
const history = require('./history');

var app =express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/getAllChannel',async function(req,res){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Content-Type", "application/json;charset=utf-8");
    res.status(200);
    let ch = await channel.getAll()
    res.json(ch);
});

app.get('/addChannel',async function(req,res){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Content-Type", "application/json;charset=utf-8");
    res.status(200);
    let ch = await channel.add(req.query.name, req.query.youtube, req.query.twitcasting, req.query.bilibili);
    res.json(ch);
});

app.get('/delChannel',async function(req,res){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Content-Type", "application/json;charset=utf-8");
    res.status(200);
    let ch = await channel.del(req.query.id);
    res.json(ch);
});
app.get('/stop',async function(req,res){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Content-Type", "application/json;charset=utf-8");
    res.status(200);
    let ch = await recorder.stop(req.query.id);
    res.json(ch);
});

app.get('/recording',async function(req,res){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Content-Type", "application/json;charset=utf-8");
    res.status(200);
    let ch = recorder.getRecording();
    let vtuber = [];
    for(i=0;i<ch.length;i++){
        let name = await channel.getName(ch[i]);
        let info = await history.getLast(ch[i]);
        vtuber[i] = {id:ch[i], name:name, title:info.title, start_time:info.start_time, type:info.type};
        
    }
    res.json(vtuber);
});

app.get('/configGetAll',async function(req,res){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Content-Type", "application/json;charset=utf-8");
    res.status(200);
    let ch = await config.getAll(req.query.id);
    res.json(ch);
});
app.post('/saveConfig', async function(req,res){
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Content-Type", "application/json;charset=utf-8");
    res.status(200);
    data = req.body;
    let ret = {status:''};
    for(var i=0;i<data.name.length;i++){
        let res = await config.set(data.name[i], data.value[i]);
        if(res){
            ret.status = 'error';
        }
    }
    if(!ret.status){
        ret.status = 'ok';
    }
    config.init();
    res.json(ret);
});

var server = app.listen(3001,()=>{
    var host = server.address().address;
    var port = server.address().port;
    console.log('web ui listening at http://%s:%s', host, port);
})