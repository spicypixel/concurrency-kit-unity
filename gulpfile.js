var gulp = require("gulp");
var gutil = require("gulp-util");
var msbuild = require("gulp-msbuild");
var nunit = require("gulp-nunit-runner");
var del = require("del");
var spawn = require("child_process").spawn;
var path = require("path");
var pathExists = require("path-exists");

// Default task to run continuous integration
gulp.task("default", ["ci"]);

// Continuous integration runs various scenarios
gulp.task("ci", ["install"]);

// Install
gulp.task("install", () => copyDependenciesToAssets()
  .then(() => installToUnity()));

function copyDependenciesToAssets() {
  var assetsDir = path.join(__dirname, "Assets");
  var nodeModuleDir = path.join(__dirname, "node_modules", "spicypixel-concurrency-kit-cs");
  var baseSrcDir = path.join(nodeModuleDir, "Source");  
  var binDestDir = path.join(assetsDir, "SpicyPixel", "Modules", "ConcurrencyKit", "Bin");
  var testDestDir = binDestDir;
  
  var binAssemblies = [
    "System.Threading", 
    "SpicyPixel.Threading",
    "SpicyPixel.Threading.Unity"];

  var testAssemblies = [
    "SpicyPixel.Threading.Test",
    "SpicyPixel.Threading.Unity.Test"];
  
  var promises = [];
  
  binAssemblies.forEach(assembly => {
    promises.concat(
      new Promise((resolve, reject) => {
        var srcDir = path.join(baseSrcDir, assembly, "bin", "Release");
        
        gulp
          .src(path.join(srcDir, assembly + ".dll"), {base: srcDir})
          .pipe(gulp.dest(binDestDir))
          .on("end", resolve)
          .on("error", reject);
      })
    );
  });
  
  testAssemblies.forEach(assembly => {
    promises.concat(
      new Promise((resolve, reject) => {
        var srcDir = path.join(baseSrcDir, assembly, "bin", "Release");
        
        gulp
          .src(path.join(srcDir, assembly + ".dll"), {base: srcDir})
          .pipe(gulp.dest(testDestDir))
          .on("end", resolve)
          .on("error", reject);
      })
    );
  });

  return Promise.all (promises);
}

function installToUnity() {
  // Install the build into a Unity Assets folder if it exists.
  // Path is relative to a node_modules/<this module> install.
  var assetsDir = path.join(__dirname, "..", "..", "Assets");
    
  return pathExists(assetsDir).then(exists => {
    if (!exists) {
      gutil.log("Skipping asset install because folder does not exist: ", assetsDir);
      return;
    }
    
    gutil.log ("Proceeding with asset install");

    var srcDir = path.join(__dirname, "Assets", "SpicyPixel", "Modules", "ConcurrencyKit");
    var destDir = path.join(assetsDir, "SpicyPixel", "Modules", "ConcurrencyKit");
        
    return new Promise((resolve, reject) => {
      gulp
        .src([path.join(srcDir, "**/*"), "!**/*.meta"], {base: srcDir})
        .pipe(gulp.dest(destDir))
        .on("end", resolve)
        .on("error", reject);
    });
  });
}