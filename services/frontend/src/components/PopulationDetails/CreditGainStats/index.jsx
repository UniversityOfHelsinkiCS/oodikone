import { Tab } from 'semantic-ui-react'

import { getMonthsForDegree } from '@/common'
import { populationStatisticsToolTips } from '@/common/InfoToolTips'
import { InfoBox } from '@/components/InfoBox'
import { CreditDistributionDevelopment } from './CreditDistributionDevelopment'
import { CreditsGainedTab } from './CreditsGainedTab'
import { StatisticsTab } from './StatisticsTab'
import './creditGainStats.css'

export const CreditGainStats = ({ filteredStudents, query, year }) => {
  const combinedProgramme = query.combinedProgramme ?? ''

  const programmeGoalTime = combinedProgramme
    ? getMonthsForDegree(`${query.programme}-${combinedProgramme}`)
    : getMonthsForDegree(query.programme)

  return (
    <div id="credit-gain-stats">
      <div style={{ marginBottom: '20px' }}>
        <InfoBox content={populationStatisticsToolTips.creditStatistics} />
      </div>
      {filteredStudents && (
        <Tab
          data-cy="credit-stats-tab"
          defaultActiveIndex={2}
          menu={{ pointing: true }}
          panes={[
            {
              menuItem: 'Credits gained',
              render: () => (
                <Tab.Pane>
                  <CreditsGainedTab
                    allStudents={filteredStudents}
                    programme={query.programme}
                    programmeGoalTime={programmeGoalTime}
                    year={year}
                  />
                </Tab.Pane>
              ),
            },
            {
              menuItem: 'Statistics',
              render: () => (
                <Tab.Pane>
                  <StatisticsTab allStudents={filteredStudents} programme={query.programme} />
                </Tab.Pane>
              ),
            },
            {
              menuItem: 'Distribution development',
              render: () => (
                <Tab.Pane>
                  <CreditDistributionDevelopment
                    combinedProgramme=""
                    programme={query.programme}
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
              ),
            },
          ]}
        />
      )}
    </div>
  )
}
