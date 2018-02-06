import React from 'react';
import { Card, Icon } from 'semantic-ui-react';
import PropTypes from 'prop-types';

import styles from './creditGraphTooltip.css';

const CreditGraphTooltip = (props) => {
  const { active, translate } = props;
  if (active) {
    const { payload } = props;
    const { name } = payload[0];
    const {
      title, credits, date, grade, passed
    } = payload[0].payload;

    return (
      <Card>
        <Card.Content >
          <Card.Header className={styles.tooltipHeader}>
            {title}
          </Card.Header>
          <Card.Meta className={styles.tooltipMeta}>
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
          <Card.Description className={styles.tooltipBody}>
            <div className={styles.tooltipBodyItem}>
              <div className={styles.tooltipBodyTitle}>{translate('common.credits')}</div>
              <div className={styles.tooltipBodyValue}>{credits}</div>

            </div>
            <div className={styles.tooltipBodyItem}>
              <div className={styles.tooltipBodyTitle}>{translate('common.grade')}</div>
              <div className={styles.tooltipBodyValue}>{grade}</div>
            </div>
            <div className={styles.tooltipBodyItem}>
              <div className={styles.tooltipBodyTitle}>{translate('common.passed')}</div>
              <div className={styles.tooltipBodyValue}>
                {
                  passed
                    ? (<Icon name="check circle outline" color="green" />)
                    : (<Icon name="remove circle outline" color="red" />)
                }
              </div>
            </div>
          </Card.Description>
        </Card.Content>
      </Card>
    );
  }
  return null;
};

const {
  func, bool, arrayOf, object
} = PropTypes;

CreditGraphTooltip.propTypes = {
  translate: func.isRequired,
  active: bool.isRequired,
  payload: arrayOf(object).isRequired
};

export default CreditGraphTooltip;
