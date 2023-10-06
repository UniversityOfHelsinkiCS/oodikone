import React, { useCallback } from 'react'
import { Tab } from 'semantic-ui-react'
import { getMonthsForDegree } from 'common'
import { useTabChangeAnalytics } from '../../../common/hooks'
import InfoBox from '../../Info/InfoBox'
import StatisticsTab from './StatisticsTab'
import CreditsGainedTab from './CreditsGainedTab'
import CreditDistributionDevelopment from './CreditDistributionDevelopment'
import infotooltips from '../../../common/InfoToolTips'
import './creditGainStats.css'

const CreditGainStats = ({ filteredStudents, query, creditDateFilterOptions, year }) => {
  const combinedProgramme = query?.studyRights?.combinedProgramme || ''

  const programmeGoalTime = combinedProgramme
    ? getMonthsForDegree(`${query?.studyRights?.programme}-${combinedProgramme}`)
    : getMonthsForDegree(query?.studyRights?.programme)

  const renderCreditsGainTab = useCallback(() => {
    return (
      <Tab.Pane attached={false}>
        <CreditsGainedTab
          allStudents={filteredStudents}
          query={query}
          creditDateFilterOptions={creditDateFilterOptions}
          programmeGoalTime={programmeGoalTime}
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
          students={filteredStudents}
          programme={query?.studyRights?.programme}
          combinedProgramme=""
          year={year}
        />
        {combinedProgramme && (
          <CreditDistributionDevelopment
            students={filteredStudents}
            programme={combinedProgramme}
            combinedProgramme={combinedProgramme}
            year={year}
          />
        )}
      </Tab.Pane>
    )
  }, [filteredStudents])

  const { handleTabChange } = useTabChangeAnalytics()

  return (
    <div id="credit-gain-stats">
      <InfoBox content={infotooltips.PopulationStatistics.CreditStatistics} />
      {filteredStudents && (
        <Tab
          defaultActiveIndex={2}
          onTabChange={handleTabChange}
          menu={{ pointing: true }}
          panes={[
            {
              menuItem: 'Credits Gained',
              render: renderCreditsGainTab,
            },
            {
              menuItem: 'Statistics',
              render: renderQuartersTab,
            },
            {
              menuItem: 'Distribution Development',
              render: renderDistributionDevelopment,
            },
          ]}
          data-cy="credit-stats-tab"
        />
      )}
    </div>
  )
}

export default CreditGainStats
