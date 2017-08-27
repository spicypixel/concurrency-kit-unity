import * as gulp from "gulp";
import * as BuildKit from "@spicypixel/build-kit-js";
import * as CoreKit from "@spicypixel/core-kit-js";
import * as UnityKit from "@spicypixel/unity-kit-js";

const unityModule = UnityKit.UnityModule.createFromPath(
  __dirname, "SpicyPixel", "ConcurrencyKit");
const libraryReference = new UnityKit.UnityModuleLibraryReference(
  unityModule, new BuildKit.NodeModule("@spicypixel/concurrency-kit-cs"));

gulp.task("default", () => defaultAsync());
gulp.task("clean", () => cleanAsync());
gulp.task("package", () => packageAsync());
gulp.task("install", () => installAsync());

async function defaultAsync() {
  await packageAsync();
}

async function cleanAsync() {
  await unityModule.cleanArtifactsAsync();
  await libraryReference.uninstallAsync();
}

async function installAsync() {
  await libraryReference.installAsync(
    [], [],
    ["System.Threading", "SpicyPixel.Threading", "SpicyPixel.Threading.Unity"],
    ["SpicyPixel.Threading.Test", "SpicyPixel.Threading.Unity.Test"]);
}

async function packageAsync() {
  await installAsync();
  await unityModule.exportPackageAsync();
}