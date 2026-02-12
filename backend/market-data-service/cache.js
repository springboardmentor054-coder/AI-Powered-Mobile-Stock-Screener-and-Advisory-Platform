const cache = {};

function setCache(key, value) {
  cache[key] = {
    value,
    time: Date.now()
  };
}

function getCache(key) {
  if (!cache[key]) return null;

  // expire after 5 mins
  if (Date.now() - cache[key].time > 300000)
    return null;

  return cache[key].value;
}

module.exports = { setCache, getCache };
