import client from '../client.js'

export const historyEndpoints = {
  list: (params) => client.get('/inverter/get', { params }),
}
