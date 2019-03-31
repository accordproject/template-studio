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

class CtoInput extends Component {
  constructor(props) {
    super(props);
    this.form = React.createRef();
    this.onModelChange = this.onModelChange.bind(this);
    this.onValueChange = this.onValueChange.bind(this);
  }

  onModelChange() {
  }

  onValueChange(json) {
    this.props.handleJSONChange(JSON.stringify(json));
  }

  render() {
    const json = JSON.parse(this.props.json);

    return (json &&
      <ConcertoForm
        ref={this.form}
        model={json.$class}
        modelFile={this.props.model}
        onModelChange={this.onModelChange}
        onValueChange={this.onValueChange}
        json={json}
        options={this.props.options}
        readOnly={this.props.readOnly}
      />
    );
  }
}

CtoInput.propTypes = {
  handleJSONChange: PropTypes.func.isRequired,
  json: PropTypes.string.isRequired,
  model: PropTypes.string.isRequired,
  options: PropTypes.object,
  readOnly: PropTypes.bool,
};

export default CtoInput;
