const stateManager = require('../05_STATE_MANAGER/state_manager');

async function handleRetry(taskDef, error, attempt) {
  const maxRetries = taskDef.retries || 0;
  if (attempt > maxRetries) {
    throw new Error(`Task '${taskDef.id}' failed after ${attempt} attempts: ${error.message}`);
  }
  const backoff = Math.pow(2, attempt) * 100; // Exponential backoff (100ms, 200ms, 400ms...)
  console.log(`Task '${taskDef.id}' failed: ${error.message}. Retrying attempt ${attempt}/${maxRetries} in ${backoff}ms...`);
  return new Promise(resolve => setTimeout(resolve, backoff));
}

async function executeTask(taskDef, context = {}, executorFn) {
  if (!executorFn || typeof executorFn !== 'function') {
    throw new Error(`No execution function provided for task: ${taskDef.id}`);
  }

  // Pre-execution checkpoint
  try {
    stateManager.createCheckpoint(`pre_task_${taskDef.id}`);
  } catch (err) {
    console.warn(`Could not create pre-execution checkpoint for ${taskDef.id}: ${err.message}`);
  }

  const timeoutMs = taskDef.timeout || 30000; // Default 30s timeout
  let attempt = 0;
  
  while (true) {
    try {
      let timeoutId;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`Timeout of ${timeoutMs}ms exceeded`));
        }, timeoutMs);
      });

      // Run task and wait for completion
      const taskPromise = Promise.resolve(executorFn(taskDef.params, context));
      
      const result = await Promise.race([taskPromise, timeoutPromise]);
      clearTimeout(timeoutId);

      // Post-execution checkpoint on success
      try {
        stateManager.createCheckpoint(`post_task_${taskDef.id}`);
      } catch (err) {
        console.warn(`Could not create post-execution checkpoint for ${taskDef.id}: ${err.message}`);
      }

      return result;
    } catch (error) {
      attempt++;
      if (attempt > (taskDef.retries || 0)) {
        throw error;
      }
      await handleRetry(taskDef, error, attempt);
    }
  }
}

module.exports = {
  executeTask,
  handleRetry
};
