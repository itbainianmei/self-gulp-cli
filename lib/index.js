// 实现这个项目的构建任务
const {src,dest,parallel,series,watch} = require('gulp')
const del = require('del')
const browserSync = require('browser-sync')//开发服务器，支持代码修改过后代码自动更新到浏览器上
const loadPlugins = require('gulp-load-plugins')
const plugins = loadPlugins()
const cwd = process.cwd()
let config = {
    // default
    
}
const bs = browserSync.create()//创建开发服务器
try{
    const loadConfig = require(`${cwd}/pages.config.js`)
    config = Object.assign({},config,loadConfig)
}catch(e){

}
const clean = ()=>{
    const loadConfig = require(`${cwd}/pages.config.js`)
    config = Object.assign({},config,loadConfig)
    return del([config.build.dist,config.build.tmp])
}
const style = ()=>{
    return src(config.build.paths.styles,{base:config.build.src, cwd:config.build.src})
        .pipe(plugins.sass({outputStyle:'expanded'}))
        .pipe(dest(config.build.tmp))
        .pipe(bs.reload({stream:true}))
}
const image = ()=>{
    return src(config.build.paths.image,{base:config.build.src, cwd:config.build.src})
        .pipe(plugins.imagemin())
        .pipe(dest(config.build.dist))
}
const font = ()=>{
    return src(config.build.paths.fonts,{base:config.build.src, cwd:config.build.src})
        .pipe(plugins.imagemin())
        .pipe(dest(config.build.dist))
}
const js = ()=>{
    return src(config.build.paths.js,{base:config.build.src, cwd:config.build.src})
        .pipe(plugins.babel({presets:[require('@babel/preset-env')]}))
        .pipe(dest(config.build.tmp))
        .pipe(bs.reload({stream:true}))
}
const html = ()=>{
    return src(config.build.paths.html,{base:config.build.src, cwd:config.build.src})
        .pipe(plugins.swig({data:config.data}))
        .pipe(dest(config.build.tmp))
        .pipe(bs.reload({stream:true}))
}
const extra=()=>{
    return src(config.build.public,{base:config.build.public})
        .pipe(dest(config.build.dist))
}

const serve = ()=>{
    watch(config.build.paths.styles,{cwd:config.build.src},style)
    watch(config.build.paths.js,{cwd:config.build.src},js)
    watch(config.build.paths.html,{cwd:config.build.src},html)
    watch([
        config.build.paths.image,
        config.build.paths.fonts,
    ],{cwd:config.build.src},bs.reload)
    watch([
        '**'
    ],{cwd:config.build.public},bs.reload)
    bs.init({
        // files:'dist/**',
        port:8020,
        server:{
            baseDir:[config.build.tmp,config.build.src,config.build.public],
            routes:{
                '/node_modules':'node_modules'
            }
        }
    })
}
const useref = ()=>{
    return src(config.build.paths.html,{base:config.build.tmp,cwd:config.build.tmp})
        .pipe(plugins.useref({searchPath:[config.build.tmp,'.']}))
        .pipe(plugins.if(/.js$/,plugins.uglify()))
        .pipe(plugins.if(/.css$/,plugins.cleanCss()))
        .pipe(plugins.if(/.html$/,plugins.htmlmin({
            collapseWhitespace:true,
            minifyCss:true,
            minifyJs:true
        })))
        .pipe(dest(config.build.dist))
}
const compile = parallel(style,js,html)
const build = series(
    clean,
    parallel(series(compile,useref),
    extra,
    image,
    font))

const develop = series(compile,serve)
module.exports = {
    build,
    clean,
    develop
}