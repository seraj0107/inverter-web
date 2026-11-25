import client from '../client.js'

export const adminEndpoints = {
  listClients: () => client.get('/admin/clients'),
  getClientHistory: (clientId) => client.get(`/admin/clients/${clientId}/history`),
  uploadInverter: (formData) =>
    client.post('/admin/inverters/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
}
