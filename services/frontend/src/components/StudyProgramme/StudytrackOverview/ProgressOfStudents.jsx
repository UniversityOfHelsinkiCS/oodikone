import { BarChart } from './BarChart'
import { BasicDataTable } from './BasicDataTable'

export const ProgressOfStudents = ({ progressStats, progressComboStats, track, years }) => {
  return (
    <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
      {progressComboStats != null && (
        <>
          <h2 style={{ margin: '0 0 1rem 0' }}>Bachelor + master studyright</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div data-cy="Graph-StudytrackProgressCombo" style={{ flex: '2 1 600px', minWidth: '600px' }}>
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
      {progressComboStats != null && <h2 style={{ margin: '2rem 0 1rem 0' }}>Master studyright</h2>}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
        <div data-cy="Graph-StudytrackProgress" style={{ flex: '2 1 600px', minWidth: '600px' }}>
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
