import { RTKApi } from '@/apiConnection'
import { ChangelogData } from '@/shared/types'

const changelogApi = RTKApi.injectEndpoints({
  endpoints: builder => ({
    getChangelog: builder.query<ChangelogData, void>({
      query: () => 'changelog',
    }),
  }),
})

export const { useGetChangelogQuery } = changelogApi
