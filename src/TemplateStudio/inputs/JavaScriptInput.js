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

'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import { Form, Segment, Tab, TextArea } from 'semantic-ui-react';
import { Controlled as ReactCodeMirror } from 'react-codemirror2';
import CodeMirror from 'codemirror/lib/codemirror.js';
import Resizable from 're-resizable';
require('codemirror/addon/mode/simple.js');
require('codemirror/mode/javascript/javascript');

class JavaScriptInput extends TextArea {
    constructor(props) {
        super(props);
        this.handleJSChange = this.handleJSChange.bind(this);
    }

    handleJSChange(data) {
        this.props.handleJSChange(data);
    }

    render() {
        const { js, handleJSChange } = this.props;
        const options = {lineWrapping: false, lineNumbers: true, mode: "javascript", theme: "eclipse", matchBrackets: true, viewportMargin: Infinity};
        return (
            <Resizable
              bounds='parent'
              enable={{ top:false, right:false, bottom:true, left:false, topRight:false, bottomRight:false, bottomLeft:false, topLeft:false }}
              defaultSize={{
                  width:'auto',
                  height:350
              }}>
              <ReactCodeMirror value={js}
                               onBeforeChange={(editor, data, value) => {this.handleJSChange(value);}}
                               onChange={(editor, data, value) => {}}
                               options={options} />
            </Resizable>
        );
    };
}

export default JavaScriptInput;
