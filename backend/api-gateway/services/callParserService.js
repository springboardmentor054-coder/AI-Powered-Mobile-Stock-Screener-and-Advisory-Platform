const axios = require("axios");

module.exports = async function callParserService(query) {
  const response = await axios.post("http://localhost:5001/parse", { query });
  return response.data;
};
