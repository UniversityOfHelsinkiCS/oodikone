import React from 'react';
import PropTypes from 'prop-types';
import { Checkbox, Form, Input, Button, Message } from 'semantic-ui-react';

import { DISPLAY_DATE_FORMAT } from '../../constants';
import { reformatDate } from '../../common';

const HARDCODE_STUDY_RIGHTS = [
  'Bachelor of Science, Mathematics',
  'Bachelor of Science, Computer Science',
  'Master of Science (science), Computer Science'
];

const HARDCODE_DATE = '2010-01-01';


const PopulationSearchForm = ({
  translate, handleFormChangeFn, addPopulationFn, isQueryInvalid, clearPopulationsFn
}) => (
  <Form error={isQueryInvalid}>
    <Form.Field>
      <label htmlFor="enrollmentInput">Enrollment date(s)
        <Input id="enrollmentInput">{reformatDate(HARDCODE_DATE, DISPLAY_DATE_FORMAT)}</Input>
      </label>
    </Form.Field>
    <Form.Group id="rightGroup" grouped required>
      <label htmlFor="rightGroup">Study rights</label>
      {
      HARDCODE_STUDY_RIGHTS.map(right =>
        (<Form.Field
          key={`box-${right.trim()}`}
          label={right}
          control={Checkbox}
          value={right}
          name="studyRight"
          onChange={handleFormChangeFn}
        />))
    }
    </Form.Group>
    <Message
      error
      header="Population already in analysis"
      content="You have already fetched a population with the same query."
    />
    <Button onClick={addPopulationFn} disabled={isQueryInvalid}>Add population</Button>
    <Button onClick={clearPopulationsFn}>Clear populations</Button>
  </Form>);

const { func, bool } = PropTypes;

PopulationSearchForm.propTypes = {
  translate: func.isRequired,
  handleFormChangeFn: func.isRequired,
  addPopulationFn: func.isRequired,
  clearPopulationsFn: func.isRequired,
  isQueryInvalid: bool.isRequired
};

export default PopulationSearchForm;
