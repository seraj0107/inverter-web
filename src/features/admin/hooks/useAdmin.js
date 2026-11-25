import { adminService } from '../services/adminService.js'

export function useAdmin() {
  return {
    listClients: adminService.listClients,
    getClientHistory: adminService.getClientHistory,
    uploadInverter: adminService.uploadInverter,
  }
}
