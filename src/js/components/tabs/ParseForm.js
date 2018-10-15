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
import InputJson from '../presentational/InputJson';
import InputSample from '../presentational/InputSample';
import TextArea from 'semantic-ui-react';
import { Form, Segment, Divider, Tab } from 'semantic-ui-react';

class ParseForm extends Form {
    constructor(props) {
        super(props);
        this.handleSampleChange = this.handleSampleChange.bind(this);
        this.handleJSONChange = this.handleJSONChange.bind(this);
    }

    handleSampleChange(sample) {
        this.props.handleSampleChange(sample);
    }

    handleJSONChange(json) {
        this.props.handleJSONChange(json);
    }
    
    render() {
        const { text, message, data, handleSampleChange, handleJSONChange } = this.props;
        return (
            <Tab.Pane>
              <InputSample
                sample={text}
                handleSampleChange={this.handleSampleChange}
              />
              <Divider hidden/>
              <Form.Field>
                <label>Deal Data (JSON)</label>
              </Form.Field>
              <InputJson
                json={data}
                handleJSONChange={this.handleJSONChange}
              />
            </Tab.Pane>
        );
    }
}

export default ParseForm;
