#!/bin/false
// common functions for parsing the JSON comments out of
// the C wrapper files (like common.py)

/// Object representing each builtin
function Builtin(j) {
  // remove arrays of description - folw it down with newlines
  if ("description" in j)
    if (j.description instanceof Array)
      j.description = j.description.join("\n\n");
  for (var k in j)
    this[k] = j[k];
}

Builtin.prototype.getDescription = function() {
  var d = "";
  if ("description" in this)
    d = this.description;
  if (d instanceof Array)
      d = d.join("\n\n");
  return d;
};

Builtin.prototype.getURL = function() {
  if (this.type == "class")
    anchor = this.class;
  else if ("class" in this)
    anchor = "l_"+this.class+"_"+this.name;
  else 
    anchor = "l__global_"+this.name;
  return "http://www.espruino.com/Reference#"+anchor;
};

/// Tern types - for tern.js json format
function getBasicTernType(t) {
  if (["int","float","int32"].indexOf(t)>=0) return "number";
  if (t=="pin") return "+Pin";
  if (t=="bool") return "bool";
  if (t=="JsVarArray") return "?"; // TODO: not right. Should be variable arg count
  return "?";
}

/// Get full Tern type - for tern.js json format
Builtin.prototype.getTernType = function() { 
  if (["class","library"].indexOf(this.type)>=0) {
    return "fn()";
  } else if (["function","method","staticmethod","constructor"].indexOf(this.type)>=0) {
    // it's a function
    var args = [];     
    if ("params" in this)
      args = this.params.map(function (p) {
        return p[0]+": "+getBasicTernType(p[1]);
      });
    var ret = "";
    if ("return" in this)
      ret = " -> "+getBasicTernType(this.return[0]); 
    return "fn("+args.join("\, ")+")"+ret;
  } else {
    return getBasicTernType(this.return[0]);
  }
};

/// Get any files that we think might contain 'JSON' tags
exports.getWrapperFiles = function (callback) {
  require('child_process').exec("find .. -name jswrap*.c", function(error, stdout, stderr) {
    callback(stdout.toString().trim().split("\n"));
  });
}

/// Extract the /*JSON ... */ comments from a file and parse them
exports.readWrapperFile = function(filename) {
  var contents = require("fs").readFileSync(filename).toString();
  var builtins = [];
  var comments = contents.match( /\/\*JSON(?:(?!\*\/).|[\n\r])*\*\//g );
  if (comments) comments.forEach(function(comment) {
    var j = new Builtin(JSON.parse(comment.slice(6,-2)));
    j.implementation = filename;
    builtins.push(j);
  });
  return builtins;
}

/// Extract all parsed /*JSON ... */ comments from all files
exports.readAllWrapperFiles = function(callback) {
  exports.getWrapperFiles(function(files) {
    var builtins = [];
    files.forEach(function(filename) {
      builtins = builtins.concat(exports.readWrapperFile(filename));
    });
    callback(builtins);
  });
}

