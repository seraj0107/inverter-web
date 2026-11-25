import { dashboardEndpoints } from '../../../api/endpoints/dashboard.js'

export const dashboardService = {
  getSummary: async () => {
    const { data } = await dashboardEndpoints.getSummary()
    return data?.data ?? data
  },
}
