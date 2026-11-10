
const APP_URL = process.env.APP_URL;
const SECRET = process.env.CRON_SECRET;

async function main() {
  if (!APP_URL || !SECRET) {
    console.error("APP_URL or CRON_SECRET is missing");
    process.exit(1);
  }

  try {
    const response = await fetch(
      `${APP_URL.replace(/\/+$/, "")}/trigger`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${SECRET}`,
          "Content-Type": "application/json"
        },
        signal: AbortSignal.timeout(15000)
      }
    );

    const result = await response.json();

    console.log(JSON.stringify({
      cron: "heartbeat",
      httpStatus: response.status,
      result,
      timestamp: new Date().toISOString()
    }));

    if (!response.ok) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error("Cron execution failed:", error.message);
    process.exitCode = 1;
  }
}

main();
