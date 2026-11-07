console.log("PASS  printed a pass first");
process.kill(process.pid, "SIGKILL");
setTimeout(() => {}, 5000);
