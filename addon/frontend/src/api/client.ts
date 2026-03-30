import axios from 'axios'
import { INGRESS_BASE } from '../main'

const client = axios.create({
  baseURL: INGRESS_BASE,
  timeout: 10000,
})

client.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err.response?.data?.detail || err.message || 'Unknown error'
    return Promise.reject(new Error(msg))
  }
)

export default client
