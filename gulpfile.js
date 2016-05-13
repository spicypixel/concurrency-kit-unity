var gulp = require("gulp");
var gutil = require("gulp-util");
var msbuild = require("gulp-msbuild");
var nunit = require("gulp-nunit-runner");
var del = require("del");
var spawn = require("child_process").spawn;
var path = require("path");
var pathExists = require("path-exists");

// SKIP_INSTALL will be set during CI setup since `npm install` is run
// to install dependencies. We don"t need to run the build at that
// time because it will run again when the `ci` task is called.
if(process.env.SKIP_INSTALL == 1 && process.argv[process.argv.length - 1] == "install") {
  gutil.log("SKIP_INSTALL was set, skipping install ...");
  process.exit(0);
}

// Default task to run continuous integration
gulp.task("default", ["ci"]);

// Continuous integration is a full rebuild
gulp.task("ci", ["install"]);

function installToUnity() {
    // Install the build into a Unity Assets folder if it exists  
  var assetsDir = path.join(__dirname, "..", "..", "Assets");
    
  return pathExists(assetsDir).then(exists => {
    if (!exists) {
      gutil.log("Skipping asset install because folder does not exist: ", assetsDir);
      return;
    }
    
    gutil.log ("Proceeding with asset install");

    var srcDir = path.join(__dirname, "Assets", "SpicyPixel");
    var destDir = path.join(assetsDir, "SpicyPixel");
        
    return new Promise((resolve, reject) => {
      gulp
        .src([path.join(srcDir, "**/*"), "!**/*.meta"], {base: srcDir})
        .pipe(gulp.dest(destDir))
        .on("end", resolve)
        .on("error", reject);
    });
  });
}

// Install
gulp.task("install", () => installToUnity());
