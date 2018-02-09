import React from 'react';
import { func, arrayOf, object, number, shape } from 'prop-types';
import { Card, Icon } from 'semantic-ui-react';

import { dateFromApiToDisplay } from '../../common';

import styles from './populationQueryCard.css';

const PopulationQueryCard = ({
  translate, population, query, queryId, removeSampleFn
}) => {
  const { uuid, studyRights, enrollmentDates } = query;

  return (
    <Card className={styles.cardContainer}>
      <Card.Header className={styles.cardHeader}>
        <div>
          <Icon name="hashtag" size="small" />
          {`${translate('populationStatistics.sampleId')}: ${queryId},
          ${translate('populationStatistics.sampleSize', { amount: population.length })} `}
        </div>
        <Icon
          name="remove"
          className={styles.controlIcon}
          onClick={() => removeSampleFn(uuid)}
        />
      </Card.Header>
      <Card.Meta>
        {studyRights.length > 0 ?
          studyRights.map(right =>
            (<div key={right}><Icon name="group" size="small" /> {right}</div>))
          : (
            <div>
              <Icon name="group" size="small" />
              {` ${translate('populationStatistics.allPopulations')}`}
            </div>
          )
        }
        {enrollmentDates.length > 0 ?
          enrollmentDates.map(date =>
            (<div className={styles.dateItem} key={date}><Icon name="calendar" size="small" /> {dateFromApiToDisplay(date)}</div>))
          : (null)
        }
      </Card.Meta>
    </Card>
  );
};

PopulationQueryCard.propTypes = {
  translate: func.isRequired,
  population: arrayOf(object).isRequired,
  query: shape(object).isRequired,
  queryId: number.isRequired,
  removeSampleFn: func.isRequired
};

export default PopulationQueryCard;
