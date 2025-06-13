const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const SOURCE_DIR = __dirname;
const DIST_DIR = path.join(__dirname, "dist");

function getAllJsFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip folders that should not be minified
    if (
      entry.isDirectory() &&
      !["node_modules", "dist", ".cache", ".git"].includes(entry.name)
    ) {
      getAllJsFiles(fullPath, fileList);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      fileList.push(fullPath);
    }
  }

  return fileList;
}

function getOutputPath(inputPath) {
  return path.join(DIST_DIR, path.relative(SOURCE_DIR, inputPath));
}

function minifyFile(inputPath) {
  const outputPath = getOutputPath(inputPath);
  const outputDir = path.dirname(outputPath);
  fs.mkdirSync(outputDir, { recursive: true });

  const cmd = `npx terser "${inputPath}" -o "${outputPath}"`;
  execSync(cmd);
  console.log(`✅ Minified: ${path.relative(SOURCE_DIR, inputPath)}`);
}

function runMinify() {
  const allJsFiles = getAllJsFiles(SOURCE_DIR);
  console.log(`🔍 Found ${allJsFiles.length} JS files to minify...\n`);

  allJsFiles.forEach(minifyFile);

  console.log(`\n🎉 Done. Minified files saved in: /dist`);
}

runMinify();
