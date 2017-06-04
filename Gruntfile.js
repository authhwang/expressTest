module.exports = function(grunt){
    //加载插件
    [
        'grunt-cafe-mocha',
        'grunt-contrib-jshint',
    ].forEach(function(task){
        grunt.loadNpmTasks(task);
    });
    //配置控件
    grunt.initConfig({
        cafemocha: {
            all: {src: 'qa/tests-*.js',options: {ui:'tdd'},}
        },
        jshint: {
            app: ['meadowlark.js','public/js/**/*.js',
                            'lib/**/*.js'],
            qa: ['Gruntfile.js','public/qa/**/*.js','qa/**/*.js'],
        },
        
    });
    grunt.registerTask('default',['cafemocha','jshint']);
};