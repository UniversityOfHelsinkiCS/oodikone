import { Alert, Box, Container, Stack } from '@mui/material'
import { debounce } from 'lodash'
import { useState } from 'react'

import { isDefaultServiceProvider } from '@/common'
import { useLanguage } from '@/components/LanguagePicker/useLanguage'
import { FilterOldProgrammesToggle } from '@/components/material/FilterOldProgrammesToggle'
import { Loading } from '@/components/material/Loading'
import { PageTitle } from '@/components/material/PageTitle'
import { AccessDeniedMessage } from '@/components/Routes/AccessDeniedMessage'
import { useCurrentCurriculumPeriod } from '@/hooks/currentCurriculumPeriod'
import { useGetProgrammesQuery } from '@/redux/populations'
import { useGetStudyProgrammePinsQuery } from '@/redux/studyProgrammePins'
import { CombinedDegreeProgramme, DegreeProgramme } from '@/types/api/faculty'
import { getCombinedProgrammeName } from '@/util/combinedProgramme'
import { createLocaleComparator, createPinnedFirstComparator } from '@/util/comparator'
import { Name } from '@oodikone/shared/types'
import { StudyProgrammeFilter } from './StudyProgrammeFilter'
import { StudyProgrammeTable } from './StudyProgrammeTable'

export const StudyProgrammeSelector = () => {
  const { getTextIn } = useLanguage()
  const { data: programmes, isLoading } = useGetProgrammesQuery()
  const studyProgrammes = Object.values(programmes ?? {})
  const currentCurriculumPeriod = useCurrentCurriculumPeriod()
  const [filter, setFilter] = useState('')
  const [otherProgrammesVisible, setOtherProgrammesVisible] = useState(false)
  const handleFilterChange = debounce(value => {
    setFilter(value)
  }, 500)
  const bachelorProgrammes: DegreeProgramme[] = []
  const masterProgrammes: DegreeProgramme[] = []
  const doctoralProgrammes: DegreeProgramme[] = []
  const otherProgrammes: DegreeProgramme[] = []
  const combinedProgrammes: CombinedDegreeProgramme[] = []
  const localeComparator = createLocaleComparator('code')

  const { data: studyProgrammePins } = useGetStudyProgrammePinsQuery()
  const pinnedProgrammes = studyProgrammePins?.studyProgrammes ?? []
  const pinnedFirstComparator = createPinnedFirstComparator(pinnedProgrammes)

  if (isLoading || !currentCurriculumPeriod) {
    return <Loading />
  }

  const combinations = { KH90_001: 'MH90_001' }
  const filteredStudyProgrammes = studyProgrammes
    .sort(localeComparator)
    .filter(
      programme =>
        programme.code.toLowerCase().includes(filter.toLocaleLowerCase()) ||
        getTextIn(programme.name)!.toLowerCase().includes(filter.toLocaleLowerCase()) ||
        programme.progId?.toLowerCase().includes(filter.toLocaleLowerCase())
    )

  for (const programme of filteredStudyProgrammes) {
    if (programme.code === 'KH90_001') {
      const secondProgrammeCode = combinations[programme.code]
      const secondProgramme = studyProgrammes.filter(programme => programme.code === secondProgrammeCode)

      const combinedName: Name = {
        fi: getCombinedProgrammeName(
          getTextIn(programme.name, 'fi')!,
          getTextIn(secondProgramme[0]?.name, 'fi')!,
          'fi'
        ),
        en: getCombinedProgrammeName(
          getTextIn(programme.name, 'en')!,
          getTextIn(secondProgramme[0]?.name, 'en')!,
          'en'
        ),
        sv: getCombinedProgrammeName(
          getTextIn(programme.name, 'sv')!,
          getTextIn(secondProgramme[0]?.name, 'sv')!,
          'sv'
        ),
      }

      combinedProgrammes.push({
        code: `${programme.code}+${secondProgramme[0]?.code}`,
        combinedCode: `${programme.code} - ${secondProgramme[0]?.code}`,
        name: combinedName,
        progId: `${programme.progId} - ${secondProgramme[0]?.progId}`,
      })
    }
    if (isDefaultServiceProvider() && programme.code.startsWith('2_')) {
      continue
    }
    if (!programme.curriculumPeriodIds.includes(currentCurriculumPeriod.id)) {
      otherProgrammes.push(programme)
    } else if (programme.degreeProgrammeType === 'urn:code:degree-program-type:bachelors-degree') {
      bachelorProgrammes.push(programme)
    } else if (programme.degreeProgrammeType === 'urn:code:degree-program-type:masters-degree') {
      masterProgrammes.push(programme)
    } else if (programme.degreeProgrammeType === 'urn:code:degree-program-type:doctor') {
      doctoralProgrammes.push(programme)
    } else {
      otherProgrammes.push(programme)
    }
  }

  if (studyProgrammes == null) {
    return <AccessDeniedMessage />
  }

  return (
    <Container maxWidth="md">
      <PageTitle title="Study programmes" />
      <Stack direction="column" gap={2}>
        <Box>
          <StudyProgrammeFilter handleFilterChange={handleFilterChange} studyProgrammes={studyProgrammes} />
          <FilterOldProgrammesToggle
            checked={!otherProgrammesVisible}
            onChange={() => setOtherProgrammesVisible(!otherProgrammesVisible)}
          />
        </Box>
        {studyProgrammes.length > 0 && filteredStudyProgrammes.length === 0 && (
          <Alert severity="warning" variant="outlined">
            No programmes found
          </Alert>
        )}
        <StudyProgrammeTable
          header="Bachelor programmes"
          pinnedProgrammes={pinnedProgrammes}
          programmes={bachelorProgrammes.sort(pinnedFirstComparator)}
        />
        <StudyProgrammeTable
          header="Master programmes"
          pinnedProgrammes={pinnedProgrammes}
          programmes={masterProgrammes.sort(pinnedFirstComparator)}
        />
        <StudyProgrammeTable
          header="Combined programmes"
          pinnedProgrammes={pinnedProgrammes}
          programmes={combinedProgrammes.sort(pinnedFirstComparator)}
        />
        <StudyProgrammeTable
          header="Doctoral programmes"
          pinnedProgrammes={pinnedProgrammes}
          programmes={doctoralProgrammes.sort(pinnedFirstComparator)}
        />
        <StudyProgrammeTable
          header="Other programmes"
          pinnedProgrammes={pinnedProgrammes}
          programmes={otherProgrammes.sort(pinnedFirstComparator)}
          visible={otherProgrammesVisible}
        />
      </Stack>
    </Container>
  )
}
