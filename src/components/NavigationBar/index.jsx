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
        <Menu.Item onClick={() => this.setState({ activeItem: routes.index.route })}>
          <a className={styles.logo} href="/">
            <h2 className={styles.logoText}>oodikone</h2>
          </a>
        </Menu.Item>
        {
              Object.values(routes).map(value => (
                <Menu.Item
                  as={Link}
                  key={`menu-item-${value.route}`}
                  to={value.route}
                  active={activeItem === value.route}
                  onClick={() => this.setState({ activeItem: value.route })}
                >
                  {value.text}
                </Menu.Item>
              ))
            }
      </Menu>);
  }
}

export default NavigationBar;

