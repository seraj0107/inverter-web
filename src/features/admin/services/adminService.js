import { adminEndpoints } from '../../../api/endpoints/admin.js'

export const adminService = {
  listClients: async () => {
    const { data } = await adminEndpoints.listClients()
    return data
  },
  getClientHistory: async (clientId) => {
    const { data } = await adminEndpoints.getClientHistory(clientId)
    return data
  },
  uploadInverter: async (formData) => {
    const { data } = await adminEndpoints.uploadInverter(formData)
    return data
  },
}
