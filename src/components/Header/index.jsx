import React from 'react';
import { connect } from 'react-redux';
import { func } from 'prop-types';
import { getActiveLanguage, getTranslate } from 'react-localize-redux';

import NavigationBar from '../NavigationBar';

import styles from './header.css';

const Header = props => (
  <header className={styles.header} role="banner">
    <div className={styles.headerBanner} />
    <NavigationBar translate={props.translate} />
  </header>
);

Header.propTypes = {
  translate: func.isRequired
};

const mapStateToProps = ({ locale }) => ({
  translate: getTranslate(locale),
  currentLanguage: getActiveLanguage(locale).value
});

export default connect(mapStateToProps)(Header);
