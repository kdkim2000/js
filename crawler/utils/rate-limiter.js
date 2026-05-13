// Waits `ms` milliseconds — use between requests to respect rate limits
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Wraps an async fn with retry logic (exponential backoff)
async function withRetry(fn, retries = 3, baseDelay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await delay(baseDelay * Math.pow(2, i));
    }
  }
}

module.exports = { delay, withRetry };
