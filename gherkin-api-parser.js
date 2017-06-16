const fs = require('fs');

function Session(method, url, data = '') {
    this.url = url;
    this.method = method;
    this.data = data;
    this.description = "";
    this.expectResponse = "";
    this.feature = undefined;
    this.file = "";
    this.scenario = "";
}

var SessionArray = [];


function parseFile(f) {
    var res = fs.readFileSync(f, 'utf8');
    var lines = res.split(/\n/);
    var gotJson = false;
    var jsonStart = false;
    var s;
    var scenario = "";
    var feature = "";
    lines.forEach(function (line) {
        if (/.*Feature.*/.test(line)) {
           feature = line.trim();
           return;
        }
        if (/.*Scenario.*/.test(line)) {
           scenario = line.trim();
           return;
        }
        if (line.match(/via/)) {
            s = new Session();
            s.file = f;
            //console.log(line);
            var res = line.match(/via\s+([A-Z]*)\s+([a-zA-Z\/]*)/);
            if (!res) console.log(line);
            //if (!res[1]) console.log(line);
            s.method = res[1];
            s.url = res[2];
            s.scenario = scenario;
            s.feature = feature;
            //console.log(s);
        }
        if (line.match(/with json/)) {
            gotJson = true;
            return;
        }
        if (gotJson && jsonStart) {
            if (!line.match(/\"\"\"/)) {
                //console.log(line);
                s.data += line.trim();
            } else {
                SessionArray.push(JSON.parse(JSON.stringify(s)));
                gotJson = false;
                jsonStart = false;
            }
            return;
        }
        if (gotJson) {
            if (line.match(/\"\"\"/)) {
                jsonStart = true;
            }
            return;
        } 
    });
}


function readDir(dir) { 
    var d = fs.readdirSync(dir);
    d.forEach(function (f) {
        if (fs.lstatSync(dir + '/' + f).isDirectory()) {
            readDir(f);
        } else {
            //console.log(dir + '/' + f);
            if (f.match(/\.feature$/)) {
                parseFile(dir + '/' + f);
            } else {
                console.log("skip " + '/' + f);
            }
        }
    });
}




readDir(__dirname + '/');
//console.log(SessionArray);

console.log(`\n[TOC]\n`);
SessionArray.forEach(function (s){
  console.log(`## ${s.method} ${s.url}\n`);
  console.log(` - File: \`${s.file}\``);
  console.log(` - ${s.feature}`);
  console.log(` - ${s.scenario}\n`);
  console.log(`## Request Body`);
  console.log("\n```");
  try {
    var json = JSON.stringify(JSON.parse(s.data), null, '  ');
    console.log(json);
  } catch (e) {
    console.log("ERROR " + s.data );
  }
  console.log("```\n");
});
