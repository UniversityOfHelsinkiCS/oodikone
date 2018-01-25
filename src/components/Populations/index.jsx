import React from 'react';
import { connect } from 'react-redux';
import { getActiveLanguage, getTranslate } from 'react-localize-redux';
import PropTypes from 'prop-types';


import styles from './populations.css';


const Populations = props =>
  (
    <div className={styles.example}>
      {`Populations: ${props.translate('common.example')}`}
    </div>
  );

const { func } = PropTypes;

Populations.propTypes = {
  translate: func.isRequired
};

const mapStateToProps = ({ locale }) => ({
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value
});

export default connect(mapStateToProps)(Populations);
