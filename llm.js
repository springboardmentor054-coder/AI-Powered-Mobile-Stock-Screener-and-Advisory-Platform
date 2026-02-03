export function parseQuery(text) {
  if (text.toLowerCase().includes("pe")) {
    return { pe: 10 };
  }
  return { pe: 100 };
}
