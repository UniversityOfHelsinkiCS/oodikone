import Stack from '@mui/material/Stack'

import { filterInternalReleases } from '@/common'
import { PageLayout } from '@/components/common/PageLayout'
import { PageTitle } from '@/components/common/PageTitle'
import { useTitle } from '@/hooks/title'
import { ReleaseCard } from '@/pages/Changelog/ReleaseCard'
import { useGetChangelogQuery } from '@/redux/changelog'

export const Changelog = () => {
  useTitle('Changelog')
  const { data: releaseData, isFetching: isLoading } = useGetChangelogQuery()

  const visibleReleases = releaseData?.filter(filterInternalReleases).slice(0, 20) ?? []

  return (
    <PageLayout maxWidth="lg">
      <PageTitle subtitle="What's new in Oodikone" title="Changelog" />
      <Stack direction="column" gap={2}>
        {visibleReleases.map(release => (
          <ReleaseCard isLoading={isLoading} key={release.title} release={release} />
        ))}
      </Stack>
    </PageLayout>
  )
}
