// Shared response-window logic for requests that wait on a chef's answer.
// Same-day / short-notice requests (within 24h) get a tight 30-minute window
// because the meal is imminent; advance requests get a full hour. A 15-minute
// floor prevents a nonsense window if the client sends a past date.
const computeExpiry = (requestedTime, createdAt) => {
  const now = createdAt || new Date();
  let windowMs = 60 * 60 * 1000;
  if (requestedTime) {
    const target = new Date(requestedTime);
    if (!Number.isNaN(target.getTime()) && target.getTime() - now.getTime() <= 24 * 60 * 60 * 1000) {
      windowMs = 30 * 60 * 1000;
    }
  }
  windowMs = Math.max(windowMs, 15 * 60 * 1000);
  return new Date(now.getTime() + windowMs);
};

module.exports = { computeExpiry };
