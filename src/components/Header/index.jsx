import React from 'react';

import styles from './header.css';

const Header = () =>
  (
    <header className={styles.header} role="banner">
      <a className={styles.logo} href="/">
        <h1 className={styles.logoText}>oodikone pt2 header</h1>
      </a>
    </header>
  );

export default Header;
