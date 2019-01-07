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
import CodeMirror from 'codemirror/lib/codemirror.js';
import Resizable from 're-resizable';

require('codemirror/addon/mode/simple.js');

function loadErgoMode() {
  console.log('LOADING ERGO MODE');
  CodeMirror.defineSimpleMode('ergo', {
    start: [
      { regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: 'string' },
      { regex: /(?:namespace|import|define|function|transaction|concept|event|asset|participant|enum|extends|contract|over|clause|throws|emits|state|call|enforce|if|then|else|let|foreach|return|in|where|throw|constant|match|set|emit|with|or|and)\b/,
        token: 'keyword' },
      { regex: /true|false|unit|some|none|now/, token: 'atom' },
      { regex: /Any|Nothing|Unit|Integer|Double|String|Request|Response/, token: 'variable-2' },
      { regex: / o /, token: 'variable-3' },
      { regex: /0x[a-f\d]+|[-+]?(?:\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/i,
        token: 'number' },
      { regex: /\/\/.*/, token: 'comment' },
      // A next property will cause the mode to move to a different state
      { regex: /\/\*/, token: 'comment', next: 'comment' },
      { regex: /[-+\/*=<>!]+/, token: 'operator' },
      // indent and dedent properties guide autoindentation
      { regex: /[\{\[\(]/, indent: true },
      { regex: /[\}\]\)]/, dedent: true },
      { regex: /\w+/, token: 'variable' },
    ],
    comment: [
      { regex: /.*?\*\//, token: 'comment', next: 'start' },
      { regex: /.*/, token: 'comment' },
    ],
    meta: {
      dontIndentStates: ['comment'],
      lineComment: '//',
    },
  });
}
loadErgoMode();

class ErgoInput extends TextArea {
  constructor(props) {
    super(props);
    this.handleErgoChange = this.handleErgoChange.bind(this);
    this.handleErgoMounted = this.handleErgoMounted.bind(this);
  }

  handleErgoChange(editor, _data, value) {
    this.props.handleErgoChange(editor, value);
  }

  handleErgoMounted(editor) {
    this.props.handleErgoMounted(editor, this.props.markers);
  }

  render() {
    const { value } = this.props;
    const options = { lineWrapping: true, lineNumbers: true, mode: 'ergo', theme: 'eclipse', matchBrackets: true, viewportMargin: Infinity };
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
          value={value}
          onBeforeChange={this.handleErgoChange}
          editorDidMount={this.handleErgoMounted}
          options={options}
        />
      </Resizable>
    );
  }
}

ErgoInput.propTypes = {
  handleErgoChange: PropTypes.func.isRequired,
  handleErgoMounted: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
};

export default ErgoInput;
