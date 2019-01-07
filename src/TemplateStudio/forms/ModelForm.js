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

function showModel(name) {
  return name.indexOf('@') === -1 && name.indexOf('system.cto') === -1;
}

class ModelForm extends Form {
  constructor(props) {
    super(props);
    this.handleModelChange = this.handleModelChange.bind(this);
    this.handleErgoMounted = this.handleErgoMounted.bind(this);
    this.panesFromModel = this.panesFromModel.bind(this);
  }

  handleErgoMounted() {
    // for now, do nothing
  }

  handleModelChange(editor, name, model) {
    this.props.handleModelChange(editor, name, model);
  }

  panesFromModel(model) {
    const panes = [];
    for (const m of model) {
      if (showModel(m.name)) {
        panes.push({ menuItem: m.name,
          render: () =>
            (<Tab.Pane>
              <ErgoInput
                value={m.content}
                markers={m.markersSource ? m.markersSource : []}
                handleErgoMounted={this.handleErgoMounted}
                handleErgoChange={(editor, model2) => {
                  this.handleModelChange(editor, m.name, model2);
                }}
              />
            </Tab.Pane>) });
      }
    }
    return panes;
  }

  render() {
    const { model } = this.props;
    const panes = this.panesFromModel(model);
    return (
      <Form>
        <Tab panes={panes} />
      </Form>
    );
  }
}

ModelForm.propTypes = {
  handleModelChange: PropTypes.func.isRequired,
  model: PropTypes.array.isRequired,
};

export default ModelForm;
