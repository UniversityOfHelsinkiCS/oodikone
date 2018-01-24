import PropTypes from 'prop-types';

const {
  number,
  shape,
  string
} = PropTypes;

export const multicolorGraphType = shape({
  text: string.isRequired,
  value: number.isRequired
});

export const displayableDateType = shape({
  text: string.isRequired,
  value: string.isRequired
});
