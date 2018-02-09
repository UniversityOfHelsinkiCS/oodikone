import React, { Component } from 'react';
import { Menu } from 'semantic-ui-react';
import { Link, withRouter } from 'react-router-dom';
import { func, string, shape } from 'prop-types';

import { routes } from '../../constants';

import styles from './navigationBar.css';

class NavigationBar extends Component {
  static propTypes = {
    translate: func.isRequired,
    location: shape({
      pathname: string.isRequired
    })
  };
  static defaultProps = {
    location: {
      pathname: '/'
    }
  };

  state = { };

  componentDidMount() {
    const { pathname } = this.props.location;
    this.setState({ pathname });
  }

  render() {
    const { pathname } = this.state;
    const t = this.props.translate;

    const menuWidth = Object.keys(routes).length + 1;

    return (
      <Menu stackable fluid widths={menuWidth} className={styles.navBar}>
        <Menu.Item
          as={Link}
          to={routes.index.route}
          onClick={() => this.setState({ pathname: routes.index.route })}
        >
          <span className={styles.logo}>
            <h2 className={styles.logoText}>oodikone</h2>
          </span>
        </Menu.Item>
        {
          Object.values(routes).map(value => (
            <Menu.Item
              as={Link}
              key={`menu-item-${value.route}`}
              to={value.route}
              active={pathname === value.route}
              onClick={() => this.setState({ pathname: value.route })}
            >
              {t(`navigationBar.${value.translateId}`)}
            </Menu.Item>
          ))
        }
      </Menu>);
  }
}

export default withRouter(NavigationBar);

