import { historyEndpoints } from '../../../api/endpoints/history.js'

export const historyService = {
  list: async (params) => {
    const { data } = await historyEndpoints.list(params)
    return data
  },
}
