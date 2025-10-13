import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'

// FIXME: For some reason Semantic UI manages to build a working HTML -string, but MUI doesn't.
import { Icon } from 'semantic-ui-react'

const getCorrectIcon = (passed, isStudyModuleCredit) => {
  if (isStudyModuleCredit) {
    return <Icon color="purple" name="certificate" style={{ margin: 0 }} />
  }
  if (passed) {
    return <Icon color="green" name="check circle" style={{ margin: 0 }} />
  }
  return null
}

const Tile = ({ children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontWeight: 'bold' }}>{children}</div>
)
const TileValue = ({ children }) => <div style={{ fontSize: '1.25em' }}>{children}</div>

export const CreditGraphTooltip = ({ credits, date, grade, passed, isStudyModuleCredit, courseCode, courseName }) => {
  const title = `${courseName} (${courseCode})`

  return (
    <Card variant="outlined">
      <CardHeader
        content={`${title}${isStudyModuleCredit ? ' [Study Module]' : ''}`}
        style={{ whiteSpace: 'normal' }}
      />
      <CardContent style={{ display: 'grid', grid: '1fr 1fr 1fr 1fr', gridRowGap: '0.25rem' }}>
        <Tile>
          Credits <TileValue>{credits}</TileValue>
        </Tile>
        <Tile>
          Grade <TileValue>{grade}</TileValue>
        </Tile>
        <Tile>
          Date <TileValue>{date}</TileValue>
        </Tile>
        <Tile>
          {isStudyModuleCredit ? 'Module' : 'Passed'}{' '}
          <TileValue>{getCorrectIcon(passed, isStudyModuleCredit)}</TileValue>
        </Tile>
      </CardContent>
    </Card>
  )
}
