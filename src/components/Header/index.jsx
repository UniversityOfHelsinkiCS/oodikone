import React from 'react';

import styles from './header.css';

import { routes } from '../../constants';
import NavigationButton from '../NavigationButton';

const Header = () =>
  (
    <header className={styles.header} role="banner">
      <a className={styles.logo} href="/">
        <h1 className={styles.logoText}>oodikone</h1>
      </a>
      <div>
        {
              Object.keys(routes).map(key =>
                <NavigationButton key={key} route={routes[key].route} text={routes[key].text} />)
          }
      </div>


    </header>
  );

export default Header;
