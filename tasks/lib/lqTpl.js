var path = require('path');

var REQUIRE_RE = /"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|\/\*[\S\s]*?\*\/|\/(?:\\\/|[^\/\r\n])+\/(?=[^\/])|\/\/.*|(?:^|[^$])seajs\.require\s*\(\s*(["'])(.+?)\1\s*\)/g
var SLASH_RE = /\\\\/g

function parseDependencies(code) {
    var ret = []

    code.replace(SLASH_RE, "")
        .replace(REQUIRE_RE, function(m, m1, m2) {
            if (m2) {
                ret.push(m2)
            }
        })

    return ret
}
var isConvert=/^\s*define\(/;

var emptyReg=/[\r\n]+\s*?/g;
function removeEmpty(str){
    return minifyHtml(str.replace(emptyReg,''));
}
var minify = require('html-minifier').minify;
function minifyHtml(html){
    return minify(html,{
        removeComments:true,
        collapseWhitespace:true
    });
}
// helpers
function html2js(code) {
    //已经被grunt 编译过则直接执行
    if(isConvert.test(code)){
        return code;
    }
    var deps=parseDependencies(code)||[];
    deps=JSON.stringify(deps);
    var tpls={};
    var fns={};
    var fn;
    var tpl;
    var tplId;

    var _ = require('underscore');
    var htmlparser = require('htmlparser2');
    var parser = new htmlparser.Parser({
        onopentag: function(name, attribs){
            if(name === "script" && attribs.type === "text/template"){
                tplId=attribs['data-tpl'];
                fn=attribs['data-fn'];
                tpl='';
            }
        },
        ontext: function(text){
            if(!tplId)return;
            tpl+=text;
        },
        onclosetag: function(tagname){
            if(tagname === "script"){
                if(!tplId)return;
                //var html=removeEmpty(tpl);
                var html=tpl;
                if(fn){
                    fns[tplId]=_.template(html).source;
                }else{
                    tpls[tplId]=html;
                }
                tplId=null;
                fn=null;
            }
        }
    }, {decodeEntities: true});
    parser.write(code);
    parser.end();

    var fnsStr=[];
    for(var k in fns){
        fnsStr.push(k+':'+fns[k]);
    }
    fnsStr.join(',');
    fnsStr='{'+fnsStr+'}';

/*    var rst='define("' +id+ '#",'+deps+',function(require,exp,mod){' +
        'return'+rstStr+
        '})';*/
    var rst='define(function(require,exp,mod){' +
            'var tpls=' +JSON.stringify(tpls)+';'+
            'var fns=' +fnsStr+';' +
            'tpls=_.extend(tpls,fns);'+
            'return tpls;'+
        '})';
  return rst;
}

function unixy(uri) {
  return uri.replace(/\\/g, '/');
}

exports.html2js = html2js;
