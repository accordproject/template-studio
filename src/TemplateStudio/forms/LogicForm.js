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
import ErgoInput from '../inputs/ErgoInput';
import { Form, Tab } from 'semantic-ui-react';

require('codemirror/addon/mode/simple.js');

function showLogic(name) {
  return name.indexOf('@') === -1 && name.indexOf('system.cto') === -1;
}

class LogicForm extends Form {
  constructor(props) {
    super(props);
    this.handleLogicChange = this.handleLogicChange.bind(this);
    this.handleErgoMounted = this.handleErgoMounted.bind(this);
    this.panesFromLogic = this.panesFromLogic.bind(this);
  }

  handleLogicChange(editor, name, logic) {
    this.props.handleLogicChange(editor, name, logic);
  }

  handleErgoMounted(editor, markers) {
    this.props.handleErgoMounted(editor, markers);
  }

  panesFromLogic(logic) {
    const panes = [];
    for (const m of logic) {
      if (showLogic(m.name)) {
        panes.push({ menuItem: m.name,
          render: () =>
            (<Tab.Pane>
              <ErgoInput
                value={m.content}
                markers={m.markersSource ? m.markersSource : []}
                handleErgoMounted={this.handleErgoMounted}
                handleErgoChange={(editor, logic2) => {
                  this.handleLogicChange(editor, m.name, logic2);
                }}
              />
            </Tab.Pane>) });
      }
    }
    return panes;
  }

  render() {
    const { logic } = this.props;
    const panes = this.panesFromLogic(logic);
    return (
      <Form>
        <Tab panes={panes} />
      </Form>
    );
  }
}

LogicForm.propTypes = {
  handleLogicChange: PropTypes.func.isRequired,
  handleErgoMounted: PropTypes.func.isRequired,
  logic: PropTypes.array.isRequired,
};

export default LogicForm;
