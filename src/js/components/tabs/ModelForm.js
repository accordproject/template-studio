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
import InputErgo from '../presentational/InputErgo';
import { Form, Segment, Tab } from 'semantic-ui-react';

function showModel(name) {
    return name.indexOf("@") == -1 && name.indexOf("system.cto") == -1;
}

class ModelForm extends Form {
    constructor(props) {
        super(props);
        this.handleModelChange = this.handleModelChange.bind(this);
        this.panesFromModel = this.panesFromModel.bind(this);
    }

    handleModelChange(event) {
        this.props.handleModelChange(event.target.value);
    }

    panesFromModel(model) {
        let panes = [];
        for (const m of model) {
            if (showModel(m.name))
                panes.push({ 'menuItem': m.name, 'render': () =>
                             <Tab.Pane>
                               <InputErgo
                                 value={m.content}
                                 handleErgoChange={this.handleModelChange}/>
                             </Tab.Pane> });
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

export default ModelForm;
