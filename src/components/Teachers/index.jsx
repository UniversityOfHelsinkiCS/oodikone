import React from 'react';
import { connect } from 'react-redux';
import { getActiveLanguage, getTranslate } from 'react-localize-redux';
import PropTypes from 'prop-types';

import styles from './teachers.css';

const Teachers = props =>
  (
    <div className={styles.example}>
      {`Teachers: ${props.translate('common.example')}`}
    </div>
  );

const { func } = PropTypes;

Teachers.propTypes = {
  translate: func.isRequired
};

const mapStateToProps = ({ locale }) => ({
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value
});

export default connect(mapStateToProps)(Teachers);
