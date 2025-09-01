import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import { filterInternalReleases, isDefaultServiceProvider } from '@/common'
import { PageTitle } from '@/components/material/PageTitle'
import { useTitle } from '@/hooks/title'
import { useGetAuthorizedUserQuery } from '@/redux/auth'
import { useGetChangelogQuery } from '@/redux/changelog'
import { checkUserAccess, getFullStudyProgrammeRights } from '@/util/access'
import { Release } from '@oodikone/shared/types'
import { FeatureItem } from './FeatureItem'
import { MaterialInfoCard } from './MaterialInfoCard'
import { ReleaseItem } from './ReleaseItem'
import { SectionTitle } from './SectionTitle'

export const FrontPage = () => {
  useTitle()

  const { data: releaseData, isLoading } = useGetChangelogQuery()
  const { roles, programmeRights } = useGetAuthorizedUserQuery()
  const fullStudyProgrammeRights = getFullStudyProgrammeRights(programmeRights)
  const [visibleReleases, setVisibleReleases] = useState<Release[]>([])

  // TODO: Add missing features and extract access right checking
  const featureItems = [
    {
      show: true,
      title: 'University',
      content: 'View tables and diagrams about study progress of different faculties',
    },
    {
      show: checkUserAccess(['admin', 'fullSisuAccess'], roles) || programmeRights.length > 0,
      title: 'Programmes',
      content: (
        <ul>
          <li>Class statistics: View details of a specific year of a study programme</li>
          <li>Overview: View statistics of a programme across all years</li>
        </ul>
      ),
    },
    {
      show: checkUserAccess(['courseStatistics', 'admin'], roles) || fullStudyProgrammeRights.length > 0,
      title: 'Courses',
      content: 'View statistics about course attempts, completions and grades',
    },
    {
      show: checkUserAccess(['studyGuidanceGroups', 'admin'], roles) || fullStudyProgrammeRights.length > 0,
      title: 'Students',
      content: 'View detailed information for a given student',
    },
    {
      show: isDefaultServiceProvider(),
      title: 'Feedback',
      content: (
        <p>
          For questions and suggestions, please use the{' '}
          <a href="https://oodikone.helsinki.fi/feedback">feedback form</a> or shoot an email to{' '}
          <a href="mailto:grp-toska@helsinki.fi">grp-toska@helsinki.fi</a>.
        </p>
      ),
    },
  ]

  useEffect(() => {
    if (!releaseData) {
      return
    }
    setVisibleReleases([...releaseData.filter(filterInternalReleases).slice(0, 2)])
  }, [releaseData])

  return (
    <Container maxWidth="lg">
      <PageTitle subtitle="Exploratory Research on Study Data" title="Oodikone" />
      <Alert severity="warning" sx={{ justifyContent: 'center' }}>
        Our team is currently updating data tables across various views. If you notice any discrepancies or anomalies,
        please reach out to <a href="mailto:grp-toska@helsinki.fi">grp-toska@helsinki.fi</a>.
      </Alert>
      <Stack direction={{ sm: 'column', md: 'row' }} divider={<Divider flexItem orientation="vertical" />} gap={3}>
        <Stack direction="column" gap={2} sx={{ width: { sm: '100%', md: '50%' } }}>
          <SectionTitle title="Features" />
          <Stack direction="column" divider={<Divider flexItem orientation="horizontal" />} gap={2}>
            {featureItems.map(
              item => item.show && <FeatureItem content={item.content} key={item.title} title={item.title} />
            )}
          </Stack>
        </Stack>
        <Stack direction="column" gap={2} sx={{ width: { sm: '100%', md: '50%' } }}>
          <SectionTitle title="Latest updates" />
          <MaterialInfoCard />
          <Stack direction="column" divider={<Divider flexItem orientation="horizontal" />} gap={2}>
            {visibleReleases.map(release => (
              <ReleaseItem isLoading={isLoading} key={release.title} release={release} />
            ))}
          </Stack>
          <Box sx={{ justifyContent: 'center', display: 'flex' }}>
            <Button component={Link} to="/changelog" variant="contained">
              View more
            </Button>
          </Box>
        </Stack>
      </Stack>
    </Container>
  )
}
