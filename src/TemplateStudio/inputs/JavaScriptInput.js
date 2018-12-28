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
require('codemirror/mode/javascript/javascript');

class JavaScriptInput extends TextArea {
  constructor(props) {
    super(props);
    this.handleJSChange = this.handleJSChange.bind(this);
  }

  handleJSChange(_editor, _data, value) {
    this.props.handleJSChange(value);
  }

  render() {
    const { js } = this.props;
    const options = { lineWrapping: false, lineNumbers: true, mode: 'javascript', theme: 'eclipse', matchBrackets: true, viewportMargin: Infinity };
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
          height: 350,
        }}
      >
        <ReactCodeMirror
          value={js}
          onBeforeChange={this.handleJSChange}
          options={options}
        />
      </Resizable>
    );
  }
}

JavaScriptInput.propTypes = {
  handleJSChange: PropTypes.func.isRequired,
  js: PropTypes.string.isRequired,
};

export default JavaScriptInput;
