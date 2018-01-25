import React from 'react';
import { connect } from 'react-redux';
import { getActiveLanguage, getTranslate } from 'react-localize-redux';
import PropTypes from 'prop-types';

import styles from './courses.css';

const Courses = props =>
  (
    <div className={styles.example}>
      {`Courses: ${props.translate('common.example')}`}
    </div>
  );

const { func } = PropTypes;

Courses.propTypes = {
  translate: func.isRequired
};

const mapStateToProps = ({ locale }) => ({
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value
});

export default connect(mapStateToProps)(Courses);
