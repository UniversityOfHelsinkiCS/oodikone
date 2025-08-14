import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { useState } from 'react'

import { getMonthsForDegree } from '@/common'
import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { InfoBox } from '@/components/material/InfoBox'
import { PopulationQuery } from '@/types/populationSearch'

import { FormattedStudent } from '@oodikone/shared/types'
import { CreditDistributionDevelopment } from './CreditDistributionDevelopment'
import { CreditsGainedTab } from './CreditsGainedTab'
import { StatisticsTab } from './StatisticsTab'

type CreditStatisticsProps = {
  filteredStudents: FormattedStudent[]
  query: PopulationQuery
  sggYear?: number
}

export const CreditStatistics = ({ filteredStudents, query, sggYear }: CreditStatisticsProps) => {
  const { programme, years, combinedProgramme } = query
  const year = sggYear ?? years[0]

  const [selectedTab, setSelectedTab] = useState(0)

  const programmeGoalTime = combinedProgramme
    ? getMonthsForDegree(`${programme}-${combinedProgramme}`)
    : getMonthsForDegree(programme)

  if (!filteredStudents) return null

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
        <Tabs data-cy="credit-stats-tab" onChange={(_, value) => setSelectedTab(value)} value={selectedTab}>
          <Tab data-cy="credits-gained-tab" label="Credits gained" />
          <Tab data-cy="credit-statistics-tab" label="Statistics" />
          <Tab data-cy="distribution-development-tab" label="Distribution development" />
        </Tabs>
        <InfoBox content={populationStatisticsToolTips.creditStatistics} sx={{ mb: 1, mr: 1 }} />
      </Box>
      {selectedTab === 0 && (
        <CreditsGainedTab
          filteredStudents={filteredStudents}
          programme={programme}
          programmeGoalTime={programmeGoalTime}
          year={year}
        />
      )}
      {selectedTab === 1 && <StatisticsTab filteredStudents={filteredStudents} programme={programme} />}
      {selectedTab === 2 && (
        <Box>
          <CreditDistributionDevelopment
            combinedProgramme=""
            filteredStudents={filteredStudents}
            programme={programme}
            year={year}
          />
          {combinedProgramme ? (
            <CreditDistributionDevelopment
              combinedProgramme={combinedProgramme}
              filteredStudents={filteredStudents}
              programme={combinedProgramme}
              year={year}
            />
          ) : null}
        </Box>
      )}
    </Box>
  )
}
