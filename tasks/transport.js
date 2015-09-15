/*
 * grunt-cmd-transport
 * https://github.com/spmjs/grunt-cmd-transport
 *
 * Copyright (c) 2013 Hsiaoming Yang
 * Licensed under the MIT license.
 */

module.exports = function (grunt) {
    var path = require('path');
    var uglify=require('uglify-js2');
    var _ = require('underscore');

    var lqTpl = require('./lib/lqTpl');
    var script = require('./lib/script').init(grunt);
    //var style = require('./lib/style').init(grunt);
    //var json = require('./lib/json').init(grunt);

    function removeComment(code){
        var ast=uglify.parse(code);
        var stream=uglify.OutputStream({
            beautify:true
        });
        ast.print(stream);
        return stream.toString();
    }

    grunt.registerMultiTask('seajspack', 'Transport everything into cmd.', function () {

        var options = this.options({
            alias:{},
            paths:{},
            vars:{},
            map:{},
            cwd:'',
            base:'',
            idleading:'',
            // process a template or not
            process: false

        });

        var fname, destfile, count = 0;
        this.files.forEach(function (fileObj) {
            _.each(fileObj.src,function (fpath) {
                console.log('start--' + fpath);
                count++;

                // get the right filename and filepath
                if (fileObj.cwd) {
                    // not expanded
                    fname = fpath;
                    fpath = path.join(fileObj.cwd, fpath);
                } else {
                    fname = path.relative(fileObj.orig.cwd || '', fpath);
                }
                if (grunt.file.isDir(fpath)) {
                    grunt.file.mkdir(fpath);
                    return;
                }
                var extname=path.extname(fpath);
                if(extname!='.html'&&extname!='.js'){
                    return;
                }
                var srcData=grunt.file.read(fpath);
                var destfile = fileObj.dest;
                if(extname=='.html'){
                    srcData=lqTpl.html2js(srcData);
                    destfile+='.js';
                }else if(extname=='.js'){
                    //js去掉注释，方便正则进行匹配
                    srcData=removeComment(srcData);
                }
                script.parse({
                    srcData:srcData,
                    src: fpath,
                    name: fname,
                    dest: destfile
                }, options);
            });
        });

        grunt.log.writeln('transport ' + count.toString().cyan + ' files');
    });
};
