import { arrayOf, object } from 'prop-types'
import React from 'react'
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
          <Icon name="certificate" color="purple" />
        ) : passed ? (
          <Icon name="check circle outline" color="green" />
        ) : (
          <Icon name="circle outline" color="red" />
        )}
      </div>
    </div>
  </Card.Description>
)

export const CreditGraphTooltip = ({ payload }) => {
  if (payload && payload.length > 0) {
    const { name } = payload[0]
    const { title, credits, date, grade, passed, isStudyModuleCredit } = payload[0].payload
    return (
      <Card>
        <Card.Content>
          {getCardHeader(title, isStudyModuleCredit)}
          {getCardMeta(name, date)}
          {getCardDescription(credits, grade, passed, isStudyModuleCredit)}
        </Card.Content>
      </Card>
    )
  }
  return null
}

CreditGraphTooltip.defaultProps = {
  payload: [],
}

CreditGraphTooltip.propTypes = {
  payload: arrayOf(object),
}
