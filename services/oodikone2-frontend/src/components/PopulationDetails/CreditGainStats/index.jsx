import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { Tab } from 'semantic-ui-react'
import infotooltips from '../../../common/InfoToolTips'
import { useTabChangeAnalytics } from '../../../common/hooks'
import InfoBox from '../../InfoBox'
import StatisticsTab from './StatisticsTab'
import CreditsGainedTab from './CreditsGainedTab'
import './creditGainStats.css'

const CreditGainStats = ({ filteredStudents, translate }) => {
  const { CreditStatistics } = infotooltips.PopulationStatistics

  const renderCreditsGainTab = useCallback(() => {
    return (
      <Tab.Pane attached={false}>
        <CreditsGainedTab filteredStudents={filteredStudents} />
      </Tab.Pane>
    )
  }, [filteredStudents, translate])

  const renderQuartersTab = useCallback(() => {
    return (
      <Tab.Pane attached={false}>
        <StatisticsTab filteredStudents={filteredStudents} translate={translate} />
      </Tab.Pane>
    )
  }, [filteredStudents, translate])

  const { handleTabChange } = useTabChangeAnalytics('Population statistics', 'Change Credit statistics tab')

  return (
    <div id="credit-gain-stats">
      <InfoBox content={CreditStatistics.Infobox} title="Muista title" />
      {filteredStudents && (
        <Tab
          onTabChange={handleTabChange}
          menu={{ pointing: true }}
          panes={[
            {
              menuItem: 'Credits Gained',
              render: renderCreditsGainTab
            },
            {
              menuItem: translate('creditGainStats.header'),
              render: renderQuartersTab
            }
          ]}
          data-cy="credit-stats-tab"
        />
      )}
    </div>
  )
}

CreditGainStats.propTypes = {
  filteredStudents: PropTypes.arrayOf(PropTypes.object).isRequired,
  translate: PropTypes.func.isRequired
}

export default CreditGainStats
