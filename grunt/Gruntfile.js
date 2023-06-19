module.exports = function(grunt) {
  // configure the tasks
  let config = {
    pkg: grunt.file.readJSON('package.json'),

    'compile-handlebars': {
        gen: {
          partials: 'views/partials/*.hbs',
          templateData: [
          "../config.json"
        ],
        helpers: ['helpers/helpers.js'],
        files: [{
          cwd: "views/js/",
          src: "go.hbjs",
          dest: "../build/unpacked-build/content_scripts/js/",
          expand: true,
          ext: ".js"
        },{
          cwd: "views/js/",
          src: "go.hbjs_options",
          dest: "../build/unpacked-build/options/js/",
          expand: true,
          ext: ".js"
        },{
          cwd: "views/js/",
          src: "go.hbjs_popup",
          dest: "../build/unpacked-build/popup/js/",
          expand: true,
          ext: ".js"
        },{
          cwd: "views/js/",
          src: "tabs.hbjs_options",
          dest: "../build/unpacked-build/options/js/",
          expand: true,
          ext: ".js"
        },{
          cwd: "views/js/",
          src: "tabs.hbjs_popup",
          dest: "../build/unpacked-build/popup/js/",
          expand: true,
          ext: ".js"
        },{
        cwd: "views/html",
        src: "popup.hbs",
        dest: "../build/unpacked-build/popup/",
        expand: true,
        ext: ".html"
      },{
        cwd: "views/html",
        src: "options.hbs",
        dest: "../build/unpacked-build/options/",
        expand: true,
        ext: ".html"
      }]
      },
   
    },
    

    watch: {  
      handlebars: {
        files: ['views/**/*'],
        tasks: ['compile-handlebars'],
        options: {
          livereload: true,
          interrupt: false,
          spawn: false
        }
      }
    },
 
  copy: {
    static: {
      files: [{
      expand: true,
      cwd: '../src/unpacked-raw/',
      src: '**',
      dest: '../build/unpacked-build/',
    } ]
    },
    
    unpacked: {
      files: [{
      expand: true,
      cwd: '../build/unpacked-build/',
      src: '**',
      dest: '../dist/unpacked/',
    } 
  ]
    }, savego2: {
      files: [      { src: '../dist/unpacked/content_scripts/js/go.js', dest: '../dist/tmp/go.js'},
 
  ]
    }, restorego2: {
      files: [      { dest: '../dist/unpacked/content_scripts/js/go.js', src: '../dist/tmp/go.js'},
 
  ]
    },
},  

clean: {

  options: {
  force:true
   },dist: {
    
    src: ['../dist/crx/*','../dist/unpacked/*','../dist/zip/*'],
  },build: {
    
    src: ['../build/unpacked-build/'],
  },
},
  

run: {
  build: {
    options: {
   wait:true
    },
     
    // cmd: "node", // but that's the default
    args: [
      'build.js'
    ]
  }, createPatches: {
    options: {
   wait:true
    },
     
    // cmd: "node", // but that's the default
    args: [
      '../patches/createPatches.js'
    ]
  }, 
  applyFlutterPatch: {
    options: {
   wait:true
    },
     
    // cmd: "node", // but that's the default
    args: [
      'applyFlutterPatch.js'
    ]
  }, 
  applyMainPatch: {
    options: {
   wait:true
    },
     
    // cmd: "node", // but that's the default
    args: [
      '../patches/applyMainPatchMain.js'
    ]
  }
  
 
},
compress: {
 main: {
   options: {
     archive: '../dist/zip/myextension.zip'
   },
   files: [{expand: true,src: ['**'],cwd: '../build/unpacked-build'}, 
  ]
 }
},
uncss: {
  dist: {
      files: [
          { src: 'csscleaner/demo.html', dest: 'csscleaner/bootstrap.min.css' }
      ]
  }
},
  };

  grunt.initConfig(config);

  // load the tasks
  grunt.loadNpmTasks('grunt-compile-handlebars');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-run');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-compress');
  grunt.loadNpmTasks('grunt-uncss');

 
  grunt.registerTask('gen', [
    'compile-handlebars:gen'
  ] );

  grunt.registerTask('static', [
    'copy:static'
  ] );

  grunt.registerTask('build', [
    'run:build'
  ] );

  grunt.registerTask('cpatch', [
    'run:createPatches'
  ] );

  grunt.registerTask('patchf', [
    'run:applyFlutterPatch'
  ] );

  grunt.registerTask('patchm', [
    'run:applyMainPatch'
  ] );
  grunt.registerTask('buildcrx', [
    'crx:gocrx'
  ] );


  grunt.registerTask('allin', [
    'clean:build','compile-handlebars:gen', 'copy:static','run:build'
  ] );

  grunt.registerTask('allin2', [
   'clean','compile-handlebars:gen', 'copy:static','run:build','copy:unpacked'
  ] );

  grunt.registerTask('zip', [
    'compress'
  ] );

  grunt.registerTask('dist', [
    'compress','copy:unpacked'
  ] );

  grunt.registerTask('unc', [
    'uncss:dist'
  ] );

};
