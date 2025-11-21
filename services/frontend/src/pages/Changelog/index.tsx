import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import { useEffect, useState } from 'react'

import { filterInternalReleases } from '@/common'
import { PageLayout } from '@/components/common/PageLayout'
import { PageTitle } from '@/components/common/PageTitle'
import { useTitle } from '@/hooks/title'
import { useGetChangelogQuery } from '@/redux/changelog'
import { Release } from '@oodikone/shared/types'
import { ReleaseCard } from './ReleaseCard'

export const Changelog = () => {
  useTitle('Changelog')

  const { data: releaseData, isLoading } = useGetChangelogQuery()
  const [visibleReleases, setVisibleReleases] = useState<Release[]>([])

  useEffect(() => {
    if (!releaseData) {
      return
    }
    setVisibleReleases([...releaseData.filter(filterInternalReleases).slice(0, 20)])
  }, [releaseData])

  return (
    <PageLayout maxWidth="lg">
      <PageTitle subtitle="What's new in Oodikone" title="Changelog" />
      <Stack direction="column" divider={<Divider flexItem orientation="vertical" />} gap={1}>
        {visibleReleases.map(release => (
          <ReleaseCard isLoading={isLoading} key={release.title} release={release} />
        ))}
      </Stack>
    </PageLayout>
  )
}
