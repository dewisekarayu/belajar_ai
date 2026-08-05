const { buildEnvWithRuntime, ensureSqliteRuntime } = require("9router/hooks/sqliteRuntime.js");
const { spawn } = require("child_process");
const path = require("path");

// Ensure SQLite is available
try { ensureSqliteRuntime({ silent: false }); } catch (err) { console.error(err); }

const env = {
  ...buildEnvWithRuntime(process.env),
  PORT: process.env.PORT || "7860",
  HOSTNAME: "0.0.0.0"
};

const serverPath = path.join(__dirname, "node_modules/9router/app/custom-server.js");

console.log("Starting 9router backend on port", env.PORT);

const child = spawn(process.execPath, [serverPath], {
  env,
  stdio: "inherit"
});

child.on("exit", (code) => process.exit(code));
