/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Container, Divider, Icon, Menu } from 'semantic-ui-react';
import {
  parseFailure,
  modelFailure,
  logicFailure,
  metaFailure,
  executeFailure,
  templateFailure,
  otherFailure,
  anyFailure,
  ParseStatus,
  LogicStatus,
  ModelStatus,
  MetaStatus,
  ExecuteStatus,
  AllStatusLabel,
} from '../Status';

class BottomMenu extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      activeError: null,
    };

    this.handleErrorTabChange = this.handleErrorTabChange.bind(this);
    this.renderStatus = this.renderStatus.bind(this);
  }

  handleErrorTabChange(e, { name }) {
    if (this.state.activeError === name) {
      this.setState({ activeError: null });
    } else {
      this.setState({ activeError: name });
    }
  }

  renderStatus() {
    const { log, textOnly } = this.props;

    switch (this.state.activeError) {
      case 'parse':
        return <ParseStatus log={log} />;
      case 'logic':
        return <LogicStatus log={log} textOnly={textOnly} />;
      case 'model':
        return <ModelStatus log={log} />;
      case 'meta':
        return <MetaStatus log={log} />;
      case 'execute':
        return <ExecuteStatus log={log} textOnly={textOnly} />;
      default:
        return null;
    }
  }

  render() {
    const { log, textOnly } = this.props;
    return (<Container fluid>
      <Divider hidden />
      <div className="ui bottom sticky">
        { this.renderStatus() }
        <Menu fixed="bottom" color={anyFailure(log, textOnly) ? 'red' : 'grey'} inverted>
          <Menu.Item header>
            <AllStatusLabel log={log} textOnly={textOnly} />
          </Menu.Item>
          { parseFailure(log) ?
            <Menu.Item
              name="parse"
              active={this.state.activeError === 'parse'}
              onClick={this.handleErrorTabChange}
            >
              <Icon name="warning sign" />Contract Text
            </Menu.Item> : null }
          { logicFailure(log, textOnly) ?
            <Menu.Item
              name="logic"
              active={this.state.activeError === 'logic'}
              onClick={this.handleErrorTabChange}
            >
              <Icon name="warning sign" />Logic
            </Menu.Item> : null }
          { modelFailure(log) ?
            <Menu.Item
              name="model"
              active={this.state.activeError === 'model'}
              onClick={this.handleErrorTabChange}
            >
              <Icon name="warning sign" />Model
            </Menu.Item> : null }
          { metaFailure(log) ?
            <Menu.Item
              name="meta"
              active={this.state.activeError === 'meta'}
              onClick={this.handleErrorTabChange}
            >
              <Icon name="warning sign" />Metadata
            </Menu.Item> : null }
          { templateFailure(log, textOnly) && otherFailure(log, textOnly) ?
            <Menu.Item header>
                       &middot;
            </Menu.Item> : null }
          { executeFailure(log, textOnly) ?
            <Menu.Item
              name="execute"
              active={this.state.activeError === 'execute'}
              onClick={this.handleErrorTabChange}
            >
              <Icon name="warning sign" />Execution
            </Menu.Item> : null }
        </Menu>
      </div>
    </Container>);
  }
}

BottomMenu.propTypes = {
  log: PropTypes.object.isRequired,
  textOnly: PropTypes.string,
};

export default BottomMenu;
