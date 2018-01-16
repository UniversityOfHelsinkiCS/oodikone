import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import styles from './navigationButton.css';

const { string } = PropTypes;

const NavigationButton = (props) => {
  const { route, text } = props;
  return (
    <div className={styles.container}>
      <Link className="button" to={route}>{text}</Link>
    </div>
  );
};


NavigationButton.propTypes = {
  route: string.isRequired,
  text: string.isRequired
};

export default NavigationButton;
