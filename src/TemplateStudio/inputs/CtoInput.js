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

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ConcertoForm } from 'concerto-form-react';
import { Tab, Message } from 'semantic-ui-react';
import JsonInput from '../inputs/JsonInput';


class CtoInput extends Component {
  constructor(props) {
    super(props);
    this.form = React.createRef();

    this.onFormValueChange = this.onFormValueChange.bind(this);
    this.onJSONValueChange = this.onJSONValueChange.bind(this);
    this.onModelChange = this.onModelChange.bind(this);
    this.handleDeclarationSelectionChange = this.handleDeclarationSelectionChange.bind(this);

    this.state = {
      types: [],
      fqn: '',
    };
  }

  onModelChange(modelProps) {
    this.setState(modelProps);
  }

  onFormValueChange(json) {
    this.props.handleJSONChange(JSON.stringify(json, null, 2));
  }

  onJSONValueChange(json) {
    this.props.handleJSONChange(json);
  }

  handleDeclarationSelectionChange(event) {
    const state = { fqn: event.target.value };
    this.onFormValueChange(this.form.current.getForm().generateJSON(state.fqn));
    this.setState(state);
  }

  render() {
    let json;
    let type = this.state.fqn;
    let warning;
    try {
      json = JSON.parse(this.props.json);
      type = type || json.$class;
    } catch (error) {
      warning = error.message;
    }

    const selector = (
      <select
        className="ui fluid dropdown"
        onChange={this.handleDeclarationSelectionChange}
        value={this.state.fqn}
      >
        {this.state.types.map((t) => {
          const fqn = t.getFullyQualifiedName();
          return <option key={fqn} value={fqn}>{fqn}</option>;
        })}
      </select>
    );

    const panes = [
      { menuItem: 'Form',
        render: () => (
          <Tab.Pane>
            {json ?
              <ConcertoForm
                ref={this.form}
                onValueChange={this.onFormValueChange}
                onModelChange={this.onModelChange}
                type={type}
                model={this.props.model}
                json={json}
                options={this.props.options}
                readOnly={this.props.readOnly}
              /> :
              <Message warning><p>JSON Error: {warning}</p></Message>
            }
          </Tab.Pane>
        ) },
      { menuItem: 'JSON',
        render: () => (
          <Tab.Pane>
            <JsonInput
              json={this.props.json}
              handleJSONChange={this.onJSONValueChange}
            />
          </Tab.Pane>
        ) },
    ];

    return (
      <div>
        { this.props.showSelect && selector }
        <Tab menu={{ size: 'mini' }} panes={panes} />
      </div>
    );
  }
}

CtoInput.propTypes = {
  handleJSONChange: PropTypes.func.isRequired,
  json: PropTypes.string.isRequired,
  model: PropTypes.string.isRequired,
  options: PropTypes.object,
  readOnly: PropTypes.bool,
  showSelect: PropTypes.bool,
};

export default CtoInput;
