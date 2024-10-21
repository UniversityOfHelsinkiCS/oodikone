import { Card, Icon } from 'semantic-ui-react'

const getCardHeader = (title, isStudyModuleCredit) => (
  <Card.Header content={`${title}${isStudyModuleCredit ? ' [Study Module]' : ''}`} style={{ whiteSpace: 'normal' }} />
)

const getCorrectIcon = (passed, isStudyModuleCredit) => {
  if (isStudyModuleCredit) {
    return <Icon color="purple" name="certificate" style={{ margin: 0 }} />
  }
  if (passed) {
    return <Icon color="green" name="check circle" style={{ margin: 0 }} />
  }
  return null
}

const getCardDescription = (credits, date, grade, passed, isStudyModuleCredit) => {
  const items = [
    {
      title: 'Credits',
      value: credits,
    },
    {
      title: 'Grade',
      value: grade,
    },
    {
      title: 'Date',
      value: date,
    },
    {
      title: isStudyModuleCredit ? 'Module' : 'Passed',
      value: getCorrectIcon(passed, isStudyModuleCredit),
    },
  ]

  return (
    <Card.Description style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridRowGap: '0.25rem' }}>
      {items.map(({ title, value }) => (
        <div key={title} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', fontWeight: 'bold' }}>
          {title}
          <div style={{ fontSize: '1rem' }}>{value}</div>
        </div>
      ))}
    </Card.Description>
  )
}

export const CreditGraphTooltip = ({ payload = [] }) => {
  if (payload.length === 0) return null

  const { credits, date, grade, passed, isStudyModuleCredit, courseCode, courseName } = payload[0].payload
  return (
    <Card>
      <Card.Content>
        {getCardHeader(`${courseName} (${courseCode})`, isStudyModuleCredit)}
        {getCardDescription(credits, date, grade, passed, isStudyModuleCredit)}
      </Card.Content>
    </Card>
  )
}
