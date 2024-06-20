import { Card, Icon } from 'semantic-ui-react'

import './creditGraphTooltip.css'

const getCardHeader = (title, isStudyModuleCredit) =>
  isStudyModuleCredit ? (
    <Card.Header className="tooltipHeader">{`${title} [Study Module]`}</Card.Header>
  ) : (
    <Card.Header className="tooltipHeader">{title}</Card.Header>
  )

const getCardMeta = (name, date) => (
  <Card.Meta className="tooltipMeta">
    <div>
      <Icon.Group size="small">
        <Icon name="student" />
        <Icon corner name="hashtag" />
      </Icon.Group>
      <span>{name}</span>
    </div>
    <div>
      <Icon name="calendar" size="small" />
      <span>{date}</span>
    </div>
  </Card.Meta>
)

const getCardDescription = (credits, grade, passed, isStudyModuleCredit) => (
  <Card.Description className="tooltipBody">
    <div className="tooltipBodyItem">
      <div className="tooltipBodyTitle">Credits</div>
      <div className="tooltipBodyValue">{credits}</div>
    </div>
    <div className="tooltipBodyItem">
      <div className="tooltipBodyTitle">Grade</div>
      <div className="tooltipBodyValue">{grade}</div>
    </div>
    <div className="tooltipBodyItem">
      <div className="tooltipBodyTitle">{isStudyModuleCredit ? 'module' : 'Passed'}</div>
      <div className="tooltipBodyValue">
        {isStudyModuleCredit ? ( // eslint-disable-line
          <Icon color="purple" name="certificate" />
        ) : passed ? (
          <Icon color="green" name="check circle outline" />
        ) : (
          <Icon color="red" name="circle outline" />
        )}
      </div>
    </div>
  </Card.Description>
)

export const CreditGraphTooltip = ({ payload = [] }) => {
  if (payload.length === 0) return null

  const { name } = payload[0]
  const { credits, date, grade, passed, isStudyModuleCredit, courseCode, courseName } = payload[0].payload
  return (
    <Card>
      <Card.Content>
        {getCardHeader(`${courseName} (${courseCode})`, isStudyModuleCredit)}
        {getCardMeta(name, date)}
        {getCardDescription(credits, grade, passed, isStudyModuleCredit)}
      </Card.Content>
    </Card>
  )
}
