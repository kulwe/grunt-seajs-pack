exports.init = function (grunt) {
    var path = require('path');
    var _ = grunt.util._;
    var exports = {};

    //
    var parsed = {};
    exports.parse = function (fileObj, options) {
        grunt.log.verbose.writeln('Transport ' + fileObj.src + ' -> ' + fileObj.dest);

        var data = fileObj.srcData || grunt.file.read(fileObj.src);
        if (isReadyParse(data)) {
            grunt.log.warn('this model is transported!!"' + fileObj.src + '"');
            // do nothing
            return;
        }

        parsed = {};
        var id = unixy(fileObj.name);
        var deps = relativeDependencies(fileObj.src, options);

        grunt.log.verbose.writeln('---------result----------');
        grunt.log.verbose.writeln('id= '+id);
        grunt.log.verbose.writeln('deps= ' + deps);
        grunt.log.verbose.writeln('-------------------------');

        data = modifyJs(data, id, deps);
        console.log('dest-----'+fileObj.dest);
        grunt.file.write(fileObj.dest, data);
    };

    //define ( function (){})
    var requireParse = /^[\s\r\n]*define\s*\(\s*function\s*\(/;
    //移除注释
    var commitReg = /\/\*[\S\s]*?\*\/|\/\/.*/g;

    function isReadyParse(code) {
        //var testCode=code.replace(commitReg,'');
        var flag=!requireParse.test(code);
        if(flag){
            console.log(code);
        }
        return flag;
    }

    //define(function(  -> define('id',[],function(
    var contentReg = /^[\s\r\n]*define\s*\(/;

    function modifyJs(data, id, deps) {
        deps || (deps = []);
        var str = 'define("' + id + '",' + JSON.stringify(deps) + ',function(';
        //data=data.replace(commitReg,'');
        return data.replace(requireParse, str);
    }

    var REQUIRE_RE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])|\/\/.*|(?:^|[^$])(?:seajs\s*\.\s*)?require\s*\(\s*(["'])(.+?)\1\s*\)/g
    var SLASH_RE = /\\\\/g

    function regParseDependencies(code) {
        var ret = [];
        code.replace(SLASH_RE, "")
            .replace(REQUIRE_RE, function (m, m1, m2) {
                if (m2) {
                    ret.push(m2)
                }
            });
        return ret
    }

    // helpers
    // ----------------
    function unixy(uri) {
        return uri.replace(/\\/g, '/');
    }

    function relativeDependencies(fpath, options, basefile) {
        fpath=unixy(fpath);
        if (!grunt.file.exists(fpath)) {
            grunt.log.warn("can't find " + fpath);
            return [];
        }
        if (fpath in parsed) {
            grunt.log.verbose.writeln('this deps is parsed!!??' + fpath);
            return [];
        }
        parsed[fpath] = true;

        var deps = [];
        var data = grunt.file.read(fpath);
        var path;
        deps = regParseDependencies(data);
        grunt.log.verbose.writeln('one: id='+fpath+',deps='+deps);

        var dep;
        for (var i = 0, il = deps.length; i < il; i++) {
            path = getPath(deps[i], options, fpath);
            //????id??id???path
            deps[i]=path;
            dep=relativeDependencies(path, options, fpath);
            deps=deps.concat(dep);
        }
        return _.uniq(deps);
    }

    //
    function appendext(uri) {
        var ext = path.extname(uri);
        if (!ext)
            return uri + '.js';
        return uri;
    }

    //???е?require() ??????????????????????gruntfile.js
    //???????./?????????
    function getPath(id, options, basefile) {
        var fpath;
        var first = id.charAt(0);
        if(id.charAt(0)=='.'){
            fpath = path.join(path.dirname(basefile), id);
        }else{
            fpath=id;
        }
        fpath = unixy(appendext(fpath));
        grunt.log.verbose.writeln('find require("'+id+'")-->require("'+fpath+'")');
        return fpath;
    }
    return exports;
};
