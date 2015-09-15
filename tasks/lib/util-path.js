/**
 * Created by kule on 2015/9/11.
 */
/**
 * util-path.js - The utilities for operating path such as id, uri
 */

var opt={
    alias:{},
    paths:{},
    vars:{},
    map:{},
    cwd:'',
    base:''
};
exports.init=function(options){
    var DIRNAME_RE = /[^?#]*\//

    var DOT_RE = /\/\.\//g
    var DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//
    var MULTI_SLASH_RE = /([^:/])\/+\//g

// Extract the directory portion of a path
// dirname("a/b/c.js?t=123#xx/zz") ==> "a/b/"
// ref: http://jsperf.com/regex-vs-split/2
    function dirname(path) {
        return path.match(DIRNAME_RE)[0]
    }

// Canonicalize a path
// realpath("http://test.com/a//./b/../c") ==> "http://test.com/a/c"
    function realpath(path) {
        // /a/b/./c/./d ==> /a/b/c/d
        path = path.replace(DOT_RE, "/")

        /*
         @author wh1100717
         a//b/c ==> a/b/c
         a///b/////c ==> a/b/c
         DOUBLE_DOT_RE matches a/b/c//../d path correctly only if replace // with / first
         */
        path = path.replace(MULTI_SLASH_RE, "$1/")

        // a/b/c/../../d  ==>  a/b/../d  ==>  a/d
        while (path.match(DOUBLE_DOT_RE)) {
            path = path.replace(DOUBLE_DOT_RE, "/")
        }

        return path
    }

// Normalize an id
// normalize("path/to/a") ==> "path/to/a.js"
// NOTICE: substring is faster than negative slice and RegExp
    var extReg=/\.[\w\d]+$/i;
    function normalize(path) {
        var last = path.length - 1
        var lastC = path.charAt(last)

        // If the uri ends with `#`, just return it without '#'
        if (lastC === "#") {
            return path.substring(0, last)
        }

        return (extReg.test(path) ||
        path.indexOf("?") > 0 ||
        lastC === "/") ? path : path + ".js"
    }


    var PATHS_RE = /^([^/:]+)(\/.+)$/
    var VARS_RE = /{([^{]+)}/g

    function parseAlias(id) {
        var alias = options.alias
        return alias && isString(alias[id]) ? alias[id] : id
    }

    function parsePaths(id) {
        var paths = options.paths
        var m

        if (paths && (m = id.match(PATHS_RE)) && isString(paths[m[1]])) {
            id = paths[m[1]] + m[2]
        }

        return id
    }

    function parseVars(id) {
        var vars = options.vars

        if (vars && id.indexOf("{") > -1) {
            id = id.replace(VARS_RE, function(m, key) {
                return isString(vars[key]) ? vars[key] : m
            })
        }

        return id
    }

    function parseMap(uri) {
        var map = options.map
        var ret = uri

        if (map) {
            for (var i = 0, len = map.length; i < len; i++) {
                var rule = map[i]

                ret = isFunction(rule) ?
                    (rule(uri) || uri) :
                    uri.replace(rule[0], rule[1])

                // Only apply the first matched rule
                if (ret !== uri) break
            }
        }

        return ret
    }


    var ABSOLUTE_RE = /^\/\/.|:\//
    var ROOT_DIR_RE = /^.*?\/\/.*?\//

    function addBase(id, refUri) {
        var ret
        var first = id.charAt(0)

        // Absolute
        if (ABSOLUTE_RE.test(id)) {
            ret = id
        }
        // Relative
        else if (first === ".") {
            ret = realpath((refUri ? dirname(refUri) : options.cwd) + id)
        }
        // Root
        else if (first === "/") {
            var m = options.cwd.match(ROOT_DIR_RE)
            ret = m ? m[0] + id.substring(1) : id
        }
        // Top-level
        else {
            ret = options.base + id
        }

        // Add default protocol when uri begins with "//"
/*        if (ret.indexOf("//") === 0) {
            ret = location.protocol + ret
        }*/

        return ret
    }

    function id2Uri(id, refUri) {
        if (!id) return ""

        id = parseAlias(id)
        id = parsePaths(id)
        id = parseVars(id)
        id = normalize(id)

        var uri = addBase(id, refUri)
        uri = parseMap(uri)

        return uri
    }
    return id2Uri;
};

return exports;