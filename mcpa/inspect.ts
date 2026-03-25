const url = "https://mem-brain-api-cutover-v4-production.up.railway.app/api/v1";
const key = "mb_live_eZIZhI7n__VpDELjuTZtQ-MpTPCrhntiXaER4wcJSN8";

async function run() {
  const req = async (path: string, opts: any = {}) => {
    const r = await fetch(url + path, {
      ...opts,
      headers: { "Content-Type": "application/json", "X-API-Key": key }
    });
    return r.json();
  };

  console.log("=== SEARCH ===");
  const search = await req("/memories/search", { 
    method: "POST", 
    body: JSON.stringify({ query: "test", k: 2 }) 
  });
  console.log(JSON.stringify(search, null, 2));

  console.log("=== CREATE ===");
  const c = await req("/memories", {
    method: "POST",
    body: JSON.stringify({ content: "test diagnostic memory", tags: ["test"] })
  });
  console.log(JSON.stringify(c, null, 2));

  if (c.job_id) {
    let status = "processing";
    while(status !== "completed" && status !== "failed") {
      await new Promise(r => setTimeout(r, 1000));
      const j = await req(`/memories/jobs/${c.job_id}`);
      status = j.status;
      if (status === "completed") {
        console.log("=== GET BY ID ===");
        const mem = await req(`/memories/${j.result.memory_id}`);
        console.log(JSON.stringify(mem, null, 2));
      }
    }
  }
}
run();
