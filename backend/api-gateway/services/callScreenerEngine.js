const axios = require("axios");

module.exports = async function callScreenerEngine(dsl) {
  const response = await axios.post("http://localhost:5002/run", { dsl });
  return response.data;
};
