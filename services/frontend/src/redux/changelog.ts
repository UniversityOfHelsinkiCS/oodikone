import { RTKApi } from '@/apiConnection'
import { Release } from '@oodikone/shared/types'

const changelogApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getChangelog: builder.query<Release[], void>({
      query: () => 'changelog',
    }),
  }),
})

export const { useGetChangelogQuery } = changelogApi
