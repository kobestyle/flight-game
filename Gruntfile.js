module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concat: {
      options: {
        separator: ';'
      },
      js: {
        src: ['js/x.js', 'js/config.js'],
        dest: 'assets/x.concated.js'
      },
      html: {
        src: ['_index.html'],
        dest: 'index.html'
      }
    },
    usemin: {
      html: 'index.html'
    },
    uglify: {
      options: {
        banner: ''
      },
      build: {
        src: 'assets/x.concated.js',
        dest: 'assets/x.min.js'
      }
    },
    htmlmin: {
      dist: {
        options: {
          removeComments: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeOptionalTags: true
        },
        files: {
          'index.html': 'index.html',
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-usemin');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');

  // Default task(s).
  grunt.registerTask('default', ['concat', 'usemin', 'htmlmin', 'uglify']);

};
