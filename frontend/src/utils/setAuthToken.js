import axios from "axios";
import jwt_decode from "jwt-decode";

const setAuthToken = (token) => {
  axios.defaults.headers.post["Content-Type"] = "application/json";
  axios.defaults.headers.common["Access-Control-Allow-Origin"] = "*";
  if (token) {
    // Apply to every request
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    axios.defaults.headers.common['x-api-key'] = jwt_decode(token)?.rewardsApiKey;
  } else {
    // Delete auth header
    delete axios.defaults.headers.common["Authorization"];
    delete axios.defaults.headers.common['x-api-key'];
  }
};

export default setAuthToken;
