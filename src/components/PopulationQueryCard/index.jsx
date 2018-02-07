import React from 'react';
import { Card, Icon } from 'semantic-ui-react';

import styles from './populationQueryCard.css';

const PopulationQueryCard = ({
  translate, population, query, queryId, removeSampleFn
}) => (
  <Card className={styles.cardContainer}>
    <Card.Header className={styles.cardHeader}>
      <Icon name="hashtag" size="small" />
      {`${translate('populationStatistics.sampleId')}: ${queryId}`}
    </Card.Header>
    <Card.Meta>
      {query.studyRights.map(right =>
        (<div><Icon name="group" size="small" /> {right}</div>))}
    </Card.Meta>

  </Card>
);


export default PopulationQueryCard;
