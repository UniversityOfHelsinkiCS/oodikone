import React from 'react';

import styles from './header.css';

import NavigationBar from '../NavigationBar';

const Header = () =>
  (
    <header className={styles.header} role="banner">
      <NavigationBar />

    </header>
  );

export default Header;
