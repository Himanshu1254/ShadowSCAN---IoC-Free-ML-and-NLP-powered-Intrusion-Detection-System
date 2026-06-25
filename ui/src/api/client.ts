import axios from 'axios';

export const apiClient = axios.create({
  baseURL: "http://127.0.0.1:8001",
  headers: {
    "Content-Type": "application/json",
  },
});

export const apiGet = async (url: string) => {
  const res = await apiClient.get(url);
  return res.data;
};

export default apiClient;