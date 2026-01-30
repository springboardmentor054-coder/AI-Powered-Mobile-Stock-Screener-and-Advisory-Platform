import axios from "axios";

export const runScreener = async (query) => {
  const res = await axios.post("http://127.0.0.1:4000/screener", {
    query: query
  });
  return res.data;
};
