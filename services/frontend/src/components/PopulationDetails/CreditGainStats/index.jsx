import React, { useCallback } from 'react'
import { Tab } from 'semantic-ui-react'

import { getMonthsForDegree } from '@/common'
import { useTabChangeAnalytics } from '@/common/hooks'
import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { InfoBox } from '@/components/Info/InfoBox'
import { CreditDistributionDevelopment } from './CreditDistributionDevelopment'
import { CreditsGainedTab } from './CreditsGainedTab'
import { StatisticsTab } from './StatisticsTab'
import './creditGainStats.css'

export const CreditGainStats = ({ filteredStudents, query, creditDateFilterOptions, year }) => {
  const combinedProgramme = query?.studyRights?.combinedProgramme || ''

  const programmeGoalTime = combinedProgramme
    ? getMonthsForDegree(`${query?.studyRights?.programme}-${combinedProgramme}`)
    : getMonthsForDegree(query?.studyRights?.programme)

  const renderCreditsGainTab = useCallback(() => {
    return (
      <Tab.Pane attached={false}>
        <CreditsGainedTab
          allStudents={filteredStudents}
          creditDateFilterOptions={creditDateFilterOptions}
          programmeGoalTime={programmeGoalTime}
          query={query}
        />
      </Tab.Pane>
    )
  }, [filteredStudents])

  const renderQuartersTab = useCallback(() => {
    return (
      <Tab.Pane attached={false}>
        <StatisticsTab allStudents={filteredStudents} query={query} />
      </Tab.Pane>
    )
  }, [filteredStudents])

  const renderDistributionDevelopment = useCallback(() => {
    return (
      <Tab.Pane attached={false}>
        <CreditDistributionDevelopment
          combinedProgramme=""
          programme={query?.studyRights?.programme}
          students={filteredStudents}
          year={year}
        />
        {combinedProgramme && (
          <CreditDistributionDevelopment
            combinedProgramme={combinedProgramme}
            programme={combinedProgramme}
            students={filteredStudents}
            year={year}
          />
        )}
      </Tab.Pane>
    )
  }, [filteredStudents])

  const { handleTabChange } = useTabChangeAnalytics()

  return (
    <div id="credit-gain-stats">
      <div style={{ marginBottom: '20px' }}>
        <InfoBox content={populationStatisticsToolTips.CreditStatistics} />
      </div>
      {filteredStudents && (
        <Tab
          data-cy="credit-stats-tab"
          defaultActiveIndex={2}
          menu={{ pointing: true }}
          onTabChange={handleTabChange}
          panes={[
            {
              menuItem: 'Credits gained',
              render: renderCreditsGainTab,
            },
            {
              menuItem: 'Statistics',
              render: renderQuartersTab,
            },
            {
              menuItem: 'Distribution development',
              render: renderDistributionDevelopment,
            },
          ]}
        />
      )}
    </div>
  )
}
