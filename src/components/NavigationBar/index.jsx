import React, { Component } from 'react';
import { Menu } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

import { routes } from '../../constants';

import styles from './navigationBar.css';

class NavigationBar extends Component {
  constructor() {
    super();
    this.state = { activeItem: routes.index.route };
  }
  render() {
    const { activeItem } = this.state;
    const menuWidth = Object.keys(routes).length + 1;


    return (
      <Menu stackable fluid widths={menuWidth} className={styles.navBar}>
        <Menu.Item className={styles.logoContainer}
                   onClick={() => this.setState({ activeItem: routes.index.route })}>
          <a className={styles.logo} href="/">
            <h1 className={styles.logoText}>oodikone</h1>
          </a>
        </Menu.Item>
        {
                Object.keys(routes).map(key => (
                  <Menu.Item
                    as={Link}
                    key={key}
                    to={routes[key].route}
                    active={activeItem === routes[key].route}
                    onClick={() => this.setState({ activeItem: routes[key].route })}
                  >
                    {routes[key].text}
                  </Menu.Item>
                ))

            }
      </Menu>);
  }
}

export default NavigationBar;

