import React from 'react'
import { Card, Icon } from 'semantic-ui-react'
import { func, bool, arrayOf, object } from 'prop-types'

import './creditGraphTooltip.css'

const getCardHeader = (title, isStudyModuleCredit) => (
  isStudyModuleCredit ?
    <Card.Header className="tooltipHeader">
      {`${title} [Study Module]`}
    </Card.Header>
    :
    <Card.Header className="tooltipHeader">
      {title}
    </Card.Header>
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

const getCardDescription = (translate, credits, grade, passed, isStudyModuleCredit) => (
  <Card.Description className="tooltipBody">
    <div className="tooltipBodyItem">
      <div className="tooltipBodyTitle">{translate('common.credits')}</div>
      <div className="tooltipBodyValue">{credits}</div>

    </div>
    <div className="tooltipBodyItem">
      <div className="tooltipBodyTitle">{translate('common.grade')}</div>
      <div className="tooltipBodyValue">{grade}</div>
    </div>
    <div className="tooltipBodyItem">
      <div className="tooltipBodyTitle">{isStudyModuleCredit ? 'module' : translate('common.passed')}</div>
      <div className="tooltipBodyValue">
        {
          isStudyModuleCredit // eslint-disable-line
            ? (<Icon name="certificate" color="purple" />)
            : passed
              ? (<Icon name="check circle outline" color="green" />)
              : (<Icon name="circle outline" color="red" />)
        }
      </div>
    </div>
  </Card.Description>
)

const CreditGraphTooltip = (props) => {
  const { active, translate } = props
  if (active && props.payload && props.payload.length > 0) {
    const { payload } = props
    const { name } = payload[0]
    const {
      title, credits, date, grade, passed, isStudyModuleCredit
    } = payload[0].payload
    return (
      <Card>
        <Card.Content>
          {getCardHeader(title, isStudyModuleCredit)}
          {getCardMeta(name, date)}
          {getCardDescription(translate, credits, grade, passed, isStudyModuleCredit)}
        </Card.Content>
      </Card>
    )
  }
  return null
}

CreditGraphTooltip.defaultProps = {
  active: false,
  payload: []
}

CreditGraphTooltip.propTypes = {
  translate: func.isRequired,
  active: bool,
  payload: arrayOf(object)
}

export default CreditGraphTooltip
