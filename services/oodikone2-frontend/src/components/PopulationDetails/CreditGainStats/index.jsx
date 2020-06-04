import React, { useCallback } from 'react'
import PropTypes from 'prop-types'
import { Tab, Header } from 'semantic-ui-react'
import infotooltips from '../../../common/InfoToolTips'
import { useTabChangeAnalytics } from '../../../common/hooks'
import InfoBox from '../../InfoBox'
import StatisticsTab from './StatisticsTab'
import CreditsGainedTab from './CreditsGainedTab'

const CreditGainStats = ({ samples, selectedStudents, translate }) => {
  const { CreditStatistics } = infotooltips.PopulationStatistics

  const renderCreditsGainTab = useCallback(() => {
    return (
      <Tab.Pane attached={false}>
        <CreditsGainedTab
          sample={samples.filter(s => selectedStudents.includes(s.studentNumber))}
          translate={translate}
        />
      </Tab.Pane>
    )
  }, [samples, selectedStudents, translate])

  const renderQuartersTab = useCallback(() => {
    return (
      <Tab.Pane attached={false}>
        <StatisticsTab sample={samples.filter(s => selectedStudents.includes(s.studentNumber))} translate={translate} />
      </Tab.Pane>
    )
  }, [samples, selectedStudents, translate])

  const { handleTabChange } = useTabChangeAnalytics('Population statistics', 'Change Credit statistics tab')

  return (
    <>
      <Header>
        <InfoBox content={CreditStatistics.Infobox} />
      </Header>
      {samples && (
        <Tab
          onTabChange={handleTabChange}
          menu={{ pointing: true }}
          panes={[
            {
              menuItem: 'Credits gained',
              render: renderCreditsGainTab
            },
            {
              menuItem: 'Quarters',
              render: renderQuartersTab
            }
          ]}
        />
      )}
    </>
  )
}

CreditGainStats.propTypes = {
  samples: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedStudents: PropTypes.arrayOf(PropTypes.string).isRequired,
  translate: PropTypes.func.isRequired
}

export default CreditGainStats
