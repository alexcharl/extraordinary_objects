module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),
        asset_path: 'assets/',
        public_path: 'cole/',

        watch: {
            sass: {
                files: [
                    '<%= asset_path %>sass/*',
                    '<%= asset_path %>sass/*/*'
                ],
                tasks: ['compass:dev']
            },

            watchFiles: {
                files: [
                    '<%= public_path %>js/max/*'
                ],
                options: {
                    livereload: true
                }
            },

            uglify: {
                files: [
                    '<%= asset_path %>scripts/*'
                ],
                tasks: ['uglify:compile_scripts']
            }
        },

        browserSync: {
            options: {
                watchTask: true,
            },
            files: {
                src: ['<%= public_path %>css/max/*.css', '<%= public_path %>gfx/*']
            }
        },


        uglify: {

            compile_scripts: {
                options: {
                    mangle: false,
                    beautify: true,
                    compress: false,
                    sourceMap: true
                },
                files: {
                    '<%= public_path %>js/max/scripts.js': ['<%= asset_path %>scripts/*.js']
                }  
            },

            compile_plugins: {
                options: {
                    mangle: false,
                    beautify: false,
                    compress: true,
                    sourceMap: true
                },
                files: {
                    '<%= public_path %>js/plugins.js': ['<%= asset_path %>plugins/*.js']
                }
            },

            compile_all: {
                options: {
                    mangle: true,
                    beautify: false,
                    compress: {
                        // drop_console: true  // Removed to preserve console.log for debugging
                    }
                },
                files: {
                    '<%= public_path %>js/min/scripts.js': ['<%= asset_path %>plugins/*.js','<%= public_path %>js/max/scripts.js']
                }
            },
        },

        compass: {
            dev: {
                options: {
                    sassDir: '<%= asset_path %>sass',
                    cssDir: '<%= public_path %>css/max',
                    outputStyle: 'nested',
                    sourcemap: true
                }
            },
            dist: {
                options: {
                    sassDir: '<%= asset_path %>sass',
                    cssDir: '<%= public_path %>css/min',
                    outputStyle: 'compressed'
                }
            }
        }

    }); // end init config

    // Load grunt plugins.
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browser-sync');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    //register tasks

    //watch with css inject
    grunt.registerTask('default', ["browserSync", "watch"]);

    // compile all files that need compiling
    grunt.registerTask('c', ['compass', 'uglify']);


    grunt.registerTask("js", ["uglify:compile_scripts"])
    grunt.registerTask("sass", ["compass"])
    grunt.registerTask("plug", ["uglify:compile_plugins"])

};