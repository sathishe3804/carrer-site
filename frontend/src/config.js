// frontend/src/config.js
export const API_BASE_URL = (
  process.env.REACT_APP_API_URL || "https://carrer-site-production.up.railway.app"
).replace(/\/+$/, ""); // removes any trailing /
