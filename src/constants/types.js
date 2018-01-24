import PropTypes from 'prop-types';
import moment from 'moment';

const {
  number,
  shape,
  string,
  instanceOf
} = PropTypes;

export const multicolorGraphType = shape({
  text: string.isRequired,
  value: number.isRequired
});

export const displayableDateType = shape({
  text: string.isRequired,
  value: instanceOf(moment).isRequired
});
