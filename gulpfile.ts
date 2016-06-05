import * as gulp from "gulp";
import * as gutil from "gulp-util";
import * as path from "path";

import * as BuildKit from "@spicypixel-private/build-kit-js";
import * as CoreKit from "@spicypixel-private/core-kit-js";
import * as UnityKit from "@spicypixel-private/unity-kit-js";
import Promise = CoreKit.Promise;

// Default task to run continuous integration
gulp.task("default", ["ci"]);

// Continuous integration
gulp.task("ci", ["package"]);

// Install
gulp.task("install", () =>
  cleanDependencies()
    .then(() => copyDependenciesToAssets())
    .then(() => installAsModule()));

gulp.task("package", () =>
  cleanDependencies()
    .then(() => copyDependenciesToAssets())
    .then(() => buildUnityPackage()));

const unityProject = new UnityKit.UnityProject(__dirname);
const assetsDir = path.join(__dirname, "Assets");
const kitDir = path.join(assetsDir, "SpicyPixel", "Modules", "ConcurrencyKit");

async function cleanDependencies(): Promise<void> {
  gutil.log(gutil.colors.cyan("Cleaning ..."));

  await CoreKit.FileSystem.removePatternsAsync("Artifacts");
  await CoreKit.FileSystem.removePatternsAsync([
    "Bin",
    "Docs",
    "MonoDoc/SpicyPixel.ConcurrencyKit.*"
  ], { globOptions: { cwd: kitDir } });
}

function copyDependenciesToAssets(): Promise<Promise<void>[]> {
  const nodeModuleDir = require.resolve("@spicypixel-private/concurrency-kit-cs")
    .match(/.*\/node_modules\/@spicypixel-private\/[^/]+\//)[0];

  const docsSrcDir = path.join(nodeModuleDir, "Docs");
  const sourceSrcDir = path.join(nodeModuleDir, "Source");
  const docsDestDir = path.join(kitDir, "Docs");
  const monoDocDestDir = path.join(kitDir, "MonoDoc");
  const binDestDir = path.join(kitDir, "Bin");
  const testDestDir = path.join(binDestDir, "Editor");

  const binAssemblies = [
    "System.Threading",
    "SpicyPixel.Threading",
    "SpicyPixel.Threading.Unity"];

  const testAssemblies = [
    "SpicyPixel.Threading.Test",
    "SpicyPixel.Threading.Unity.Test"];

  const monoDocs = [
    "SpicyPixel.ConcurrencyKit.source",
    "assemble/SpicyPixel.ConcurrencyKit.tree",
    "assemble/SpicyPixel.ConcurrencyKit.zip",
  ];

  let promises: Promise<void>[] = [];

  binAssemblies.forEach(assembly => {
    const srcDir = path.join(sourceSrcDir, assembly, "bin", "Release");
    promises = promises.concat(
      CoreKit.FileSystem.copyPatternsAsync(
        path.join(srcDir, assembly + ".dll"),
        binDestDir,
        { base: srcDir }
      ));
  });

  testAssemblies.forEach(assembly => {
    const srcDir = path.join(sourceSrcDir, assembly, "bin", "Release");
    promises = promises.concat(
      CoreKit.FileSystem.copyPatternsAsync(
        path.join(srcDir, assembly + ".dll"),
        testDestDir,
        { base: srcDir }
      ));
  });

  promises = promises.concat(
    CoreKit.FileSystem.copyPatternsAsync(
      path.join(docsSrcDir, "**/*"),
      docsDestDir,
      { base: docsSrcDir }
    ));

  promises = promises.concat(
    CoreKit.FileSystem.copyPatternsAsync(
      monoDocs,
      monoDocDestDir,
      { cwd: path.join(nodeModuleDir, "MonoDoc"), flatten: true }
    ));

  promises = promises.concat(
    CoreKit.FileSystem.copyPatternsAsync(
      ["README.md", "LICENSE.md"],
      kitDir,
      { cwd: nodeModuleDir }
    ));

  return Promise.all(promises);
}

async function installAsModule(): Promise<void> {
  // Install as a module into a Unity Assets folder if it exists.
  // CWD path is relative to a node_modules/<this scope>/<this module> install.
  const parentAssetsDir = path.join(__dirname, "..", "..", "..", "Assets");

  try {
    await CoreKit.FileSystem.Directory.accessAsync(parentAssetsDir,
      CoreKit.FileSystem.FileSystemPermission.Visible);
  }
  catch (err) {
    gutil.log("Skipping asset install because folder does not exist: ", parentAssetsDir);
    return;
  }

  gutil.log("Proceeding with asset install");

  const srcDir = path.join(__dirname, "Assets", "SpicyPixel", "Modules", "ConcurrencyKit");
  const destDir = path.join(parentAssetsDir, "SpicyPixel", "Modules", "ConcurrencyKit");

  await CoreKit.FileSystem.copyPatternsAsync(
    [path.join(srcDir, "**/*"), "!**/*.meta"],
    destDir,
    { base: srcDir }
  );
}

async function buildUnityPackage(): Promise<void> {
  try {
    await CoreKit.FileSystem.Directory.accessAsync(assetsDir,
      CoreKit.FileSystem.FileSystemPermission.Visible);
  }
  catch (err) {
    gutil.log("Skipping build Unity package because Bin folder does not exist: ", assetsDir);
    return;
  }

  await CoreKit.FileSystem.Directory.createRecursiveAsync("Artifacts");
  const tag = await BuildKit.GitRevision.tagAsync();
  await unityProject.packageAsync(["Assets/SpicyPixel/Modules/ConcurrencyKit"],
    "./Artifacts/SpicyPixel.ConcurrencyKit-" + tag + ".unitypackage");
}