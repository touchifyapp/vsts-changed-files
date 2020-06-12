const path = require("path");
const fs = require("fs").promises;

const ROOT = path.join(__dirname, "..");

run();

async function run() {
    const { version } = await readJSON(path.join(ROOT, "package.json"));

    await updateExtension(version);
    await updateTask(version);
}

async function updateExtension(version) {
    const extPath = path.join(ROOT, "vss-extension.json");

    const ext = await readJSON(extPath);
    ext.version = version;

    await writeJSON(extPath, ext);
}

async function updateTask(version) {
    const taskPath = path.join(ROOT, "changed-files", "task.json");

    const task = await readJSON(taskPath);

    const [major, minor, patch] = version.split(".").map(s => parseInt(s));
    task.version.Major = major;
    task.version.Minor = minor;
    task.version.Patch = patch;

    await writeJSON(taskPath, task);
}

async function readJSON(path) {
    const content = await fs.readFile(path, "utf-8");
    return JSON.parse(content);
}

async function writeJSON(path, json) {
    const content = JSON.stringify(json, null, 2);
    await fs.writeFile(path, content, "utf-8");
}
