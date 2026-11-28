// audioWorker.js
// The desk's heavy audio work, off the page's thread (see ../core/AudioJobs.js).
// A module worker: it shares the desk's own code for each job.

import { runJob } from "../core/AudioJobs.js";

self.onmessage = async ({ data: { id, job, work } }) => {
  try {
    const { result, transfer = [] } = await runJob(job, work);
    self.postMessage({ id, result }, transfer);
  } catch (error) {
    self.postMessage({ id, error: error?.message ?? String(error) });
  }
};
