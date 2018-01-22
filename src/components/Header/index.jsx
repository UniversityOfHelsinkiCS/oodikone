import React from 'react';

import styles from './header.css';

import NavigationBar from '../NavigationBar';

const Header = () =>
  (
    <header className={styles.header} role="banner">
      <div className={styles.headerBanner} />
      <NavigationBar />
    </header>
  );

export default Header;
