import React from 'react';
import PropTypes from 'prop-types';
import { Card, Icon } from 'semantic-ui-react';
import { reformatDate } from '../../common';

import { studentDetailsType } from '../../constants/types';
import { DISPLAY_DATE_FORMAT } from '../../constants';
import TagListSelector from '../TagListSelector';

import styles from './studentInfoCard.css';

const StudentInfoCard = (props) => {
  const { student, translate } = props;

  const handleAddTagFn = (tag) => {
    student.tags.push(tag);
  };

  const handleRemoveTagFn = (tag) => {

  };

  return (
    <Card fluid>
      <Card.Content>
        <Card.Header>
          <Icon.Group size="large">
            <Icon name="student" />
            <Icon corner name="hashtag" />
          </Icon.Group>
          <span className={styles.cardHeader}>{`${student.studentNumber}`}</span>

        </Card.Header>
        <Card.Meta>
          <div className={styles.startDate}>
            {`${translate('studentStatistics.started')}: ${reformatDate(student.started, DISPLAY_DATE_FORMAT)}`}
          </div>
        </Card.Meta>
        <Card.Description>
          {`${translate('studentStatistics.credits')}: ${student.credits || 0}`}
        </Card.Description>
      </Card.Content>
      <Card.Content extra>
        <TagListSelector
          tags={student.tags}
          translate={translate}
          handleAddTagFn={handleAddTagFn}
          handleRemoveTagFn={handleRemoveTagFn}
        />
      </Card.Content>
    </Card>
  );
};

const { func } = PropTypes;

StudentInfoCard.propTypes = {
  student: studentDetailsType.isRequired,
  translate: func.isRequired
};

export default StudentInfoCard;

