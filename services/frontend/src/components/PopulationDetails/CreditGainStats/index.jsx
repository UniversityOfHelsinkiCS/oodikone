import React, { useCallback } from 'react'
import { Tab } from 'semantic-ui-react'
import { useTabChangeAnalytics } from '../../../common/hooks'
import InfoBox from '../../InfoBox'
import StatisticsTab from './StatisticsTab'
import CreditsGainedTab from './CreditsGainedTab'
import infotooltips from '../../../common/InfoToolTips'
import './creditGainStats.css'

const CreditGainStats = ({ filteredStudents, query }) => {
  const renderCreditsGainTab = useCallback(() => {
    return (
      <Tab.Pane attached={false}>
        <CreditsGainedTab filteredStudents={filteredStudents} />
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

  const { handleTabChange } = useTabChangeAnalytics('Population statistics', 'Change Credit statistics tab')

  return (
    <div id="credit-gain-stats">
      <InfoBox content={infotooltips.PopulationStatistics.CreditStatistics} />
      {filteredStudents && (
        <Tab
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
          ]}
          data-cy="credit-stats-tab"
        />
      )}
    </div>
  )
}

export default CreditGainStats
