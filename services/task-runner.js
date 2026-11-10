
let counter = 0;

const INTERVAL = 60 * 1000;

function runTask() {
  counter++;

  const result = {
    service: "task-runner",
    task: "background-heartbeat",
    execution: counter,
    status: "success",
    timestamp: new Date().toISOString()
  };

  console.log(JSON.stringify(result));
}

console.log("Task Runner started");

runTask();

const timer = setInterval(runTask, INTERVAL);

function shutdown() {
  console.log("Task Runner shutting down");

  clearInterval(timer);
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
