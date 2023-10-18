import { RTKApi } from 'apiConnection'

const changelogApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getChangelog: builder.query({
      query: () => `changelog`,
    }),
  }),
})

export default changelogApi
