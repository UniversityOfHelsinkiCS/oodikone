import React from 'react';

import styles from './header.css';

const Header = () =>
    <header className={styles.header} role="banner">
        <a className={styles.logo} href="/">
            <h1 className={styles.logoText}>oodikone</h1>
        </a>
    </header>;

export default Header;
