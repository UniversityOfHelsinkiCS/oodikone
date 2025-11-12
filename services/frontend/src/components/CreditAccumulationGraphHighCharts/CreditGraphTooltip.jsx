import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'

const Tile = ({ children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontWeight: 'bold' }}>{children}</div>
)
const TileValue = ({ children }) => <div style={{ fontSize: '1.25em' }}>{children}</div>

export const CreditGraphTooltip = ({ credits, date, grade, isStudyModuleCredit, courseCode, courseName }) => {
  const title = `${courseName} (${courseCode})`

  return (
    <Card variant="outlined">
      <CardHeader
        content={`${title}${isStudyModuleCredit ? ' [Study Module]' : ''}`}
        style={{ whiteSpace: 'normal' }}
      />
      <CardContent style={{ display: 'grid', grid: '1fr 1fr 1fr', gridRowGap: '0.25rem' }}>
        <Tile>
          Credits <TileValue>{credits}</TileValue>
        </Tile>
        <Tile>
          Grade <TileValue>{grade}</TileValue>
        </Tile>
        <Tile>
          Date <TileValue>{date}</TileValue>
        </Tile>
      </CardContent>
    </Card>
  )
}
