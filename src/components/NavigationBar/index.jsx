import React, { Component } from 'react';
import { Menu } from 'semantic-ui-react';
import { NavLink, Link } from 'react-router-dom';
import { func } from 'prop-types';

import { routes } from '../../constants';

import styles from './navigationBar.css';

class NavigationBar extends Component {
  static propTypes = {
    translate: func.isRequired
  };

  checkForOptionalParams = route => (
    route.endsWith('?') ? route.slice(0, route.indexOf('/:')) : route
  );

  render() {
    const t = this.props.translate;

    const menuWidth = Object.keys(routes).length + 1;

    return (
      <Menu stackable fluid widths={menuWidth} className={styles.navBar}>
        <Menu.Item
          as={Link}
          to={routes.index.route}
        >
          <span className={styles.logo}>
            <h2 className={styles.logoText}>oodikone</h2>
          </span>
        </Menu.Item>
        {
          Object.values(routes).map((value) => {
            const viewableRoute = this.checkForOptionalParams(value.route);
            return (
              <Menu.Item
                exact={viewableRoute === value.route}
                strict={viewableRoute !== value.route}
                as={NavLink}
                key={`menu-item-${viewableRoute}`}
                to={this.checkForOptionalParams(viewableRoute)}
              >
                {t(`navigationBar.${value.translateId}`)}
              </Menu.Item>
            );
          })
          }
      </Menu>);
  }
}

export default NavigationBar;

