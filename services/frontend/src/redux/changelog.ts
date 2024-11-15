import { RTKApi } from '@/apiConnection'
import { Release } from '@/shared/types'

const changelogApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getChangelog: builder.query<Release[], void>({
      query: () => 'changelog',
    }),
  }),
})

export const { useGetChangelogQuery } = changelogApi
