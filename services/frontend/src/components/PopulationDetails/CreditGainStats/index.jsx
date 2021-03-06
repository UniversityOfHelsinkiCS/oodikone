import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { Tab } from 'semantic-ui-react'
import { useTabChangeAnalytics } from '../../../common/hooks'
import InfoBox from '../../InfoBox'
import StatisticsTab from './StatisticsTab'
import CreditsGainedTab from './CreditsGainedTab'
import info from '../../../common/markdown/populationStatistics/creditStatistics.info.md'
import './creditGainStats.css'

const CreditGainStats = ({ filteredStudents }) => {
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
        <StatisticsTab filteredStudents={filteredStudents} />
      </Tab.Pane>
    )
  }, [filteredStudents])

  const { handleTabChange } = useTabChangeAnalytics('Population statistics', 'Change Credit statistics tab')

  return (
    <div id="credit-gain-stats">
      <InfoBox content={info} />
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

CreditGainStats.propTypes = {
  filteredStudents: PropTypes.arrayOf(PropTypes.object).isRequired,
}

export default CreditGainStats
