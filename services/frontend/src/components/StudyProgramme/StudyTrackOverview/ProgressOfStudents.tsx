import { BarChart } from './BarChart'
import { BasicDataTable } from './BasicDataTable'

interface ProgressStats {
  chartStats: Array<{ data: number[]; name: string }>
  tableStats: Array<Array<string | number>>
  tableTitles: string[]
}

interface ProgressOfStudentsProps {
  progressStats: ProgressStats
  progressComboStats: ProgressStats
  track: string
  years: string[]
}

export const ProgressOfStudents = ({ progressStats, progressComboStats, track, years }: ProgressOfStudentsProps) => {
  return (
    <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
      {progressComboStats != null && (
        <>
          <h2 style={{ margin: '0 0 1rem 0' }}>Bachelor + master study right</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div data-cy="Graph-StudyTrackProgressCombo" style={{ flex: '2 1 600px', minWidth: '600px' }}>
              <BarChart
                data={{
                  creditGraphStats: { [track]: progressComboStats.chartStats },
                  years,
                }}
                track={track}
              />
            </div>
            <div style={{ flex: '1 2 1000px', minWidth: '1000px' }}>
              <BasicDataTable
                data={{ [track]: progressComboStats.tableStats }}
                titles={progressComboStats.tableTitles}
                track={track}
              />
            </div>
          </div>
        </>
      )}
      {progressComboStats != null && <h2 style={{ margin: '2rem 0 1rem 0' }}>Master study right</h2>}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        <div data-cy="Graph-StudyTrackProgress" style={{ flex: '2 1 600px', minWidth: '600px' }}>
          <BarChart
            data={{
              creditGraphStats: { [track]: progressStats.chartStats },
              years,
            }}
            track={track}
          />
        </div>
        <div style={{ flex: '1 2 1000px', minWidth: '1000px' }}>
          <BasicDataTable
            data={{ [track]: progressStats.tableStats }}
            titles={progressStats.tableTitles}
            track={track}
          />
        </div>
      </div>
    </div>
  )
}
