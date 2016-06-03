var gulp = require("gulp");
var gutil = require("gulp-util");
var msbuild = require("gulp-msbuild");
var nunit = require("gulp-nunit-runner");
var del = require("del");
var spawn = require("child_process").spawn;
var path = require("path");
var pathExists = require("path-exists");
var mkdirp = require('mkdirp');
var flatten = require("gulp-flatten");
var gitRev = require('git-rev')

// Default task to run continuous integration
gulp.task("default", ["ci"]);

// Continuous integration runs various scenarios
gulp.task("ci", ["package"]);

// Install
gulp.task("install", () =>
  cleanDependencies() 
  .then(() => copyDependenciesToAssets())
  .then(() => installAsModule()));

gulp.task("package", () =>
  cleanDependencies() 
  .then(() => copyDependenciesToAssets()
  .then(() => buildUnityPackage())
));

var assetsDir = path.join(__dirname, "Assets");
var kitDir = path.join(assetsDir, "SpicyPixel", "Modules", "ConcurrencyKit");

function cleanDependencies() {
  gutil.log(gutil.colors.cyan("Cleaning ..."));
    
  return del([
    path.join(kitDir, "Artifacts"),
    path.join(kitDir, "Bin"),
    path.join(kitDir, "Docs"),
    path.join(kitDir, "MonoDoc/SpicyPixel.ConcurrencyKit.*")
  ]);
}

function copyDependenciesToAssets() {  
  var nodeModuleDir = require.resolve("spicypixel-concurrency-kit-cs")
    .match(/.*\/node_modules\/[^/]+\//)[0];

  var docsSrcDir = path.join(nodeModuleDir, "Docs"); 
  var sourceSrcDir = path.join(nodeModuleDir, "Source");
  var docsDestDir = path.join(kitDir, "Docs");
  var monoDocDestDir = path.join(kitDir, "MonoDoc");
  var binDestDir = path.join(kitDir, "Bin");
  var testDestDir = path.join(binDestDir, "Editor");
  
  var binAssemblies = [
    "System.Threading", 
    "SpicyPixel.Threading",
    "SpicyPixel.Threading.Unity"];
    
  var testAssemblies = [
    "SpicyPixel.Threading.Test",
    "SpicyPixel.Threading.Unity.Test"];
    
  var monoDocs = [
    "SpicyPixel.ConcurrencyKit.source",
    "assemble/SpicyPixel.ConcurrencyKit.tree",
    "assemble/SpicyPixel.ConcurrencyKit.zip",
  ];
  
  var promises = [];
  
  binAssemblies.forEach(assembly => {
    promises = promises.concat(
      new Promise((resolve, reject) => {
        var srcDir = path.join(sourceSrcDir, assembly, "bin", "Release");
        
        gulp
          .src(path.join(srcDir, assembly + ".dll"), {base: srcDir})
          .pipe(gulp.dest(binDestDir))
          .on("end", resolve)
          .on("error", reject);
      })
    );
  });
  
  testAssemblies.forEach(assembly => {
    promises = promises.concat(
      new Promise((resolve, reject) => {
        var srcDir = path.join(sourceSrcDir, assembly, "bin", "Release");
        
        gulp
          .src(path.join(srcDir, assembly + ".dll"), {base: srcDir})
          .pipe(gulp.dest(testDestDir))
          .on("end", resolve)
          .on("error", reject);
      })
    );
  });
  
  promises = promises.concat(
    new Promise((resolve, reject) => {
      gulp
        .src(path.join(docsSrcDir, "**/*"), { base: docsSrcDir })
        .pipe(gulp.dest(docsDestDir))
        .on("end", resolve)
        .on("error", reject);
    })
  );
  
  promises = promises.concat(
    new Promise((resolve, reject) => {
      gulp
        .src(monoDocs, { cwd: path.join(nodeModuleDir, "MonoDoc") })
        .pipe(flatten())
        .pipe(gulp.dest(monoDocDestDir))
        .on("end", resolve)
        .on("error", reject);
    })
  );
  
  promises = promises.concat(
    new Promise((resolve, reject) => {
      gulp
        .src(["README.md", "LICENSE.md"], { cwd: nodeModuleDir })
        .pipe(gulp.dest(kitDir))
        .on("end", resolve)
        .on("error", reject);
    })
  );
  
  return Promise.all (promises);
}

function installAsModule() {
  // Install as a module into a Unity Assets folder if it exists.
  // CWD path is relative to a node_modules/<this module> install.
  var parentAssetsDir = path.join(__dirname, "..", "..", "Assets");
    
  return pathExists(parentAssetsDir).then(exists => {
    if (!exists) {
      gutil.log("Skipping asset install because folder does not exist: ", parentAssetsDir);
      return new Promise((resolve, reject) => reject());
    }
    
    gutil.log ("Proceeding with asset install");

    var srcDir = path.join(__dirname, "Assets", "SpicyPixel", "Modules", "ConcurrencyKit");
    var destDir = path.join(parentAssetsDir, "SpicyPixel", "Modules", "ConcurrencyKit");
        
    return new Promise((resolve, reject) => {
      gulp
        .src([path.join(srcDir, "**/*"), "!**/*.meta"], {base: srcDir})
        .pipe(gulp.dest(destDir))
        .on("end", resolve)
        .on("error", reject);
    });
  });
}

function buildUnityPackage() {
  return pathExists(assetsDir).then(exists => {
    if (!exists) {
      gutil.log("Skipping build Unity package because Bin folder does not exist: ", assetsDir);
      return new Promise((resolve, reject) => reject());
    }
    mkdirp.sync("Artifacts");
    
    return new Promise((resolve, reject) => {
      gitRev.tag((tag) => {
        resolve(spawnAsync(getUnityPath(), [
          "-batchmode",
          "-nographics",
          "-quit",
          "-projectPath",
          __dirname,
          "-exportPackage",
          "Assets/SpicyPixel/Modules/ConcurrencyKit",
          "./Artifacts/SpicyPixel.ConcurrencyKit-" + tag + ".unitypackage"
          ]));
      });      
    });
  });
}

function getUnityPath() {
  var isWin = /^win/.test(process.platform);
  var isMac = /^darwin/.test(process.platform);
  var is64 = (process.arch === 'x64' || process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432'));
  
  if (isMac)
    return "/Applications/Unity/Unity.app/Contents/MacOS/Unity";
  
  if (isWin && is64)  
    return "C:\\Program Files\\Unity\\Editor\\Unity.exe";
    
  if (isWin && !is64)
    return "C:\\Program Files (x86)\\Unity\\Editor\\Unity.exe";
    
  throw "Unsupported OS";
}

function spawnAsync(command) {
  return spawnAsync(command, undefined);  
}

function spawnAsync(command, args) {
  return spawnAsync(command, args, undefined);
}

function spawnAsync(command, args, properties) {
  gutil.log(command + " " + args.join(' '))
  return new Promise((resolve, reject) => {
    var proc = spawn(command, args, properties);
    proc.stdout.setEncoding("utf8");
    proc.stderr.setEncoding("utf8");
    proc.stdout.on("data", data => gutil.log(data));
    proc.stderr.on("data", data => gutil.colors.red(gutil.log(data)));
    proc.on("exit", code => code == 0 ? resolve() : reject(code));
  });
}