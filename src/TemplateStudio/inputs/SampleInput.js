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
import { TextArea } from 'semantic-ui-react';
import { Controlled as ReactCodeMirror } from 'react-codemirror2';
import Resizable from 're-resizable';

require('codemirror/addon/mode/simple.js');
require('codemirror/mode/markdown/markdown');

class SampleInput extends TextArea {
  constructor(props) {
    super(props);
    this.handleSampleChange = this.handleSampleChange.bind(this);
  }

  handleSampleChange(text) {
    this.props.handleSampleChange(text);
  }

  render() {
    const { sample } = this.props;
    const options = { lineWrapping: true, lineNumbers: true, mode: 'markdown', theme: 'eclipse', matchBrackets: true, viewportMargin: Infinity };
    return (
      <Resizable
        bounds="parent"
        enable={{
          top: false,
          right: false,
          bottom: true,
          left: false,
          topRight: false,
          bottomRight: false,
          bottomLeft: false,
          topLeft: false,
        }}
        defaultSize={{
          width: 'auto',
          height: 400,
        }}
      >
        <ReactCodeMirror
          value={sample}
          onBeforeChange={(editor, data, value) => { this.handleSampleChange(value); }}
          onChange={() => {}}
          options={options}
        />
      </Resizable>
    );
  }
}

SampleInput.propTypes = {
  handleSampleChange: PropTypes.func.isRequired,
  sample: PropTypes.string.isRequired,
};

export default SampleInput;
