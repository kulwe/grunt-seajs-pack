# grunt-seajs-pack

从seajs模块中提取依赖，并根据当前路径生成id，基于grunt-cmd-transport@0.3.0修改，去掉了配置参数，
只根据去掉所有配置参数，根据路径生成id；

只支持html模板和js，html模板采用ejs，同时支持模版间依赖，如有以下文件：

- views/file/main.js
- views/file/main.html
- models/file_m.js
- tpls/layout.html

其中main.js为
```js
    define(function(require,exp,mod){
        var model=require('models/file_m.js');
        var Tpl=require('./main.html');
    });
```

main.html如下，引用了tpls/layout.html
```
<script type="text/template" data-tpl="fileBox" data-fn="true">
<% var layout=seajs.require('tpls/layout.html'); %>
<%=layout.header%>
<section>file.html自己的内容</section>
<%=layout.footer({content:'这是底部'})%>
</script>
```

layout.html如下，其中header没有属性data-fn，只作为字串使用，不进行模板预编译footer含data-fn，将会进行模板预编译，见main.html中两者的使用方法
```
<script type="text/template" data-tpl="header">
    <header>头部</header>
</script>
<script type="text/template" data-tpl="footer" data-fn="true">
    <footer><%=content%></footer>
</script>
```

经提取后main.js如下，依赖会进行深度分析，html也会进行深度分析
```js
   define('views/file/main.js',['models/file_m.js','tpls/layout.html','views/file/main.html'],function(require,exp,mod){
        var model=require('models/file_m.js');
        var Tpl=require('./main.html');
   });
```
经提取后main.html如下
```js
   define('views/file/main.html',['tpls/layout.html'],function(require,exp,mod){
        var model=require('models/file_m.js');
        var Tpl=require('./main.html');
        return {
            fileBox:function(){.......}
        }
   });
```
经提取后layout.html如下
```js
   define('tpls/layout.html',[],function(require,exp,mod){
        var tpls={
            header:'<header>头部</header>'
        };
        var fns={
            footer:function(obj){.....}
        };
        return _.extend(tpls,fns);
   });
```