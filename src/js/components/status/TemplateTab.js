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
import { Icon, Button, Dropdown } from 'semantic-ui-react';
import saveAs from 'file-saver';
require("babel-core/register");
require("babel-polyfill");

class DownloadButton extends Button {
    constructor(props) {
        super(props);
        this.handleStatusChange = this.handleStatusChange.bind(this);
        this.downloadCta = this.downloadCta.bind(this);
    }
    handleStatusChange(status) {
        this.props.handleStatusChange(status);
    }
    async downloadCta(clause) {
        if (clause !== null) {
            const template = clause.getTemplate();
            const name = template.getMetadata().getName();
            const cta = await template.toArchive('ergo');
            var blob = new Blob([cta], {type: "application/zip"});
            saveAs(blob, name + '.cta');
            this.handleStatusChange('saved');
        } else {
            console.log("CLAUSE MISSING!");
        }
    }
    render() {
        return (<Button size='tiny' color='blue' onClick={() => this.downloadCta(this.props.clause)}>
                  <Icon name="download"/> Download</Button>); }
}

class ResetButton extends Button {
    constructor(props) {
        super(props);
        this.handleResetChange = this.handleResetChange.bind(this);
    }
    handleResetChange() {
        this.props.handleResetChange();
    }
    render() {
        return (<Button size='tiny' onClick={this.handleResetChange}>
                  <Icon name="redo" flipped="horizontally"/> Reset</Button>); }
}

class UploadButton extends Dropdown {
    constructor(props) {
        super(props);
        this.uploadCta = this.uploadCta.bind(this);
    }
    async uploadCta(clause) {
        console.log("Upload TBD!");
    }
    render() { return <Dropdown.Item onClick={() => this.uploadCta(this.props.clause)}><Icon name="upload"/> Upload</Dropdown.Item>; }
}

class NewButton extends Dropdown {
    constructor(props) {
        super(props);
        this.newCta = this.newCta.bind(this);
    }
    async newCta(clause) {
        console.log("New TBD!");
    }
    render() { return <Dropdown.Item onClick={() => this.newCta(this.props.clause)}><Icon name="add"/> New</Dropdown.Item>; }
}

export { DownloadButton, ResetButton, UploadButton, NewButton };
