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

/* Default values */

const DEFAULT_TEMPLATE = ROOT_URI + '/static/archives/helloworld@0.7.1.cta';

/* Utilities */

import * as Utils from './Utils';

/* Cicero */

import { TemplateLibrary, Template, Clause } from '@accordproject/cicero-core';

import * as ciceroPackageJson from '@accordproject/cicero-core/package.json';
const ciceroVersion = ciceroPackageJson.version;

/* React */

import React, { Component } from 'react';

/* React Semantic UI */

import {
    Form,
    Container,
    Divider,
    Tab,
    Label,
    Header,
    Image,
    Input,
    Grid,
    Menu,
    Icon,
    Card,
    Confirm,
    Dimmer,
    Loader,
    Button,
    Radio
} from 'semantic-ui-react';

/* Studio components */

import GrammarInput from './inputs/GrammarInput';
import JsonInput from './inputs/JsonInput';

import ModelForm from './forms/ModelForm';
import LogicForm from './forms/LogicForm';
import CompileForm from './forms/CompileForm';
import ParseForm from './forms/ParseForm';
import ExecuteForm from './forms/ExecuteForm';

import TopMenu from './TopMenu';

import {
    parseFailure,
    modelFailure,
    logicFailure,
    metaFailure,
    executeFailure,
    templateFailure,
    otherFailure,
    anyFailure,
    ParseStatus,
    LogicStatus,
    ModelStatus,
    MetaStatus,
    ExecuteStatus,
    StatusLabel,
    AllStatusLabel
} from './Status';

import {
    DiscardButton,
    ExportButton
} from './TemplateTab';

const defaultlog =
      { text: 'success',
        model: 'success',
        logic: 'success',
        meta: 'success',
        execute: 'success',
        loading: 'success' };

class TemplateStudio extends Component {
    constructor() {
        super();
        this.state = {
            templates: [],
            templateURL: '',
            newTemplateUpload: '',
            loadingFailed: false,
            templateName: '',
            templateVersion: '',
            templateType: 'clause',
            clause: null,
            package: 'null',
            readme: '',
            text: `[Please Select a Sample Template]`,
            data: 'null',
            log: defaultlog,
            grammar: `[Please Select a Sample Template]`,
            model: `[Please Select a Sample Template]`,
            logic: `[Please Select a Sample Template]`,
            request: 'null',
            cstate: 'null',
            response: JSON.stringify(null, null, 2),
            emit: '[]',
            activeItem: 'metadata',
            activeLegal: 'template',
            activeModel: 'model',
            activeLogic: 'ergo',
            activeMeta: 'readme',
            activeError: null,
            clogic: { compiled: '', compiledLinked: '' },
            status: 'empty',
            loading: false,
            confirmreset: { flag: false, temp: null },
            markers: [], // For code mirror marking
            markersSource: [] // For code mirror marking
        };
        this.handleLoadingFailed = this.handleLoadingFailed.bind(this);
        this.handleLoadingFailedConfirm = this.handleLoadingFailedConfirm.bind(this);
        this.handleStatusChange = this.handleStatusChange.bind(this);
        this.handleDiscardChange = this.handleDiscardChange.bind(this);
        this.handleDiscardConfirmed = this.handleDiscardConfirmed.bind(this);
        this.handleDiscardAborted = this.handleDiscardAborted.bind(this);
        this.handlePackageChange = this.handlePackageChange.bind(this);
        this.handleREADMEChange = this.handleREADMEChange.bind(this);
        this.handleSampleChange = this.handleSampleChange.bind(this);
        this.handleGrammarChange = this.handleGrammarChange.bind(this);
        this.handleModelChange = this.handleModelChange.bind(this);
        this.handleJSONChange = this.handleJSONChange.bind(this);
        this.handleLogicChange = this.handleLogicChange.bind(this);
        this.handleErgoMounted = this.handleErgoMounted.bind(this);
        this.handleModelMounted = this.handleModelMounted.bind(this);
        this.handleRunLogic = this.handleRunLogic.bind(this);
        this.handleInitLogic = this.handleInitLogic.bind(this);
        this.handleCompileChange = this.handleCompileChange.bind(this);
        this.loadTemplateLibrary = this.loadTemplateLibrary.bind(this);
        this.loadTemplateFromUrl = this.loadTemplateFromUrl.bind(this);
        this.loadTemplateFromBuffer = this.loadTemplateFromBuffer.bind(this);
        this.handleItemClick = this.handleItemClick.bind(this);
        this.handleRequestChange = this.handleRequestChange.bind(this);
        this.handleStateChange = this.handleStateChange.bind(this);
        this.handleResponseChange = this.handleResponseChange.bind(this);
        this.handleEmitChange = this.handleEmitChange.bind(this);
        this.handleLegalTabChange = this.handleLegalTabChange.bind(this);
        this.handleModelTabChange = this.handleModelTabChange.bind(this);
        this.handleLogicTabChange = this.handleLogicTabChange.bind(this);
        this.handleMetaTabChange = this.handleMetaTabChange.bind(this);
        this.handleErrorTabChange = this.handleErrorTabChange.bind(this);
        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleVersionChange = this.handleVersionChange.bind(this);
        this.handleTypeChange = this.handleTypeChange.bind(this);
    }

    handleLoadingFailed(message) {
        const state = this.state;
        state.loading = false;
        state.loadingFailed = true;
        state.log.loading = message;
        this.setState(state);
    }
    handleLoadingFailedConfirm() {
        const state = this.state;
        state.log.loading = 'Unknown Error';
        state.loadingFailed = false;
        this.setState(state);
    }
    handleStatusChange(status) {
        const state = this.state;
        state.status = status;
        this.setState(state);
    }
    handleDiscardChange() {
        const state = this.state;
        if (state.status === 'changed') {
            state.confirmreset = { flag: true, temp: null };
            this.setState(state);
        } else {
            this.loadTemplateFromUrl(this.state.templateURL);
        }
    }
    handleDiscardConfirmed() {
        const state = this.state;
        state.confirmreset = { flag: false, temp: null };
        this.setState(state);
        this.loadTemplateFromUrl(this.state.templateURL);
    }
    handleDiscardAborted() {
        const state = this.state;
        state.confirmreset = { flag: false, temp: null };
        this.setState(state);
    }

    handlePackageChange(text) {
        const state = this.state;
        try {
            const packageJson = JSON.parse(text);
            state.clause.getTemplate().setPackageJson(packageJson);
            state.package = JSON.stringify(packageJson,null,2);
            state.templateName = packageJson.name;
            state.templateVersion = packageJson.version;
            state.templateType = packageJson.cicero.template;
            state.log.meta = 'package.json change successful!';
            this.setState(state);
            // Make sure to try re-parsing
            this.setState(Utils.parseSample(state.clause, state.text, state.log));
        } catch (error){
            console.log('ERROR'+JSON.stringify(error.message));
            state.package = text;
            state.log.meta = '[Change Template package.json] ' + error;
            this.setState(state);
        }
    }
    handleNameChange(e, { name, value }) {
        const state = this.state;
        state.templateName = value;
        try {
            const packageJson = JSON.parse(state.package);
            packageJson.name = value;
            state.clause.getTemplate().setPackageJson(packageJson);
            state.package = JSON.stringify(packageJson,null,2);
            state.log.meta = 'Template Name change successful!';
            state.status = 'changed';
            this.setState(state);
        } catch (error){
            console.log('ERROR'+JSON.stringify(error.message));
            state.log.meta = '[Change Template Name] ' + error;
            this.setState(state);
        }
    }
    handleVersionChange(e, { name, value }) {
        const state = this.state;
        state.templateVersion = value;
        try {
            const packageJson = JSON.parse(state.package);
            packageJson.version = value;
            state.clause.getTemplate().setPackageJson(packageJson);
            state.package = JSON.stringify(packageJson,null,2);
            state.log.meta = 'Template version change successful!';
            state.status = 'changed';
            this.setState(state);
        } catch (error){
            console.log('ERROR'+JSON.stringify(error.message));
            state.log.meta = '[Change Template Version] ' + error;
            this.setState(state);
        }
    }
    handleTypeChange(e, { name, value }) {
        const state = this.state;
        state.templateType = value;
        try {
            const packageJson = JSON.parse(state.package);
            packageJson.cicero.template = value;
            state.clause.getTemplate().setPackageJson(packageJson);
            state.package = JSON.stringify(packageJson,null,2);
            state.log.meta = 'Template kind change successful!';
            state.status = 'changed';
            this.setState(state);
            // Make sure to try re-parsing
            this.setState(Utils.parseSample(state.clause, state.text, state.log));
        } catch (error){
            console.log('ERROR'+JSON.stringify(error.message));
            state.log.meta = '[Change Template Type] ' + error;
            this.setState(state);
        }
    }
    handleREADMEChange(text) {
        const state = this.state;
        try {
            const readme = text;
            const template = state.clause.getTemplate();
            if (template.getMetadata().getREADME() != text) {
                state.status = 'changed';
                template.setReadme(readme);
            }
            state.readme = readme;
            state.log.meta = 'README change successful!';
            this.setState(state);
        } catch (error){
            console.log('ERROR'+JSON.stringify(error.message));
            state.readme = text;
            state.log.meta = '[Change Template README] ' + error;
            this.setState(state);
        }
    }

    handleSampleChange(text) {
        const state = this.state;
        const { clause, log } = state;
        if (Utils.updateSample(clause,text)) {
            state.status = 'changed';
            this.setState(state);
        }
        this.setState(Utils.parseSample(clause, text, log));
    }

    handleLegalTabChange(e, { name }) {
        const state = this.state;
        state.activeLegal = name;
        this.setState(state);
    }
    handleModelTabChange(e, { name }) {
        const state = this.state;
        state.activeModel = name;
        this.setState(state);
    }
    handleLogicTabChange(e, { name }) {
        const state = this.state;
        state.activeLogic = name;
        this.setState(state);
    }
    handleMetaTabChange(e, { name }) {
        const state = this.state;
        state.activeMeta = name;
        this.setState(state);
    }
    handleErrorTabChange(e, { name }) {
        const state = this.state;
        if (state.activeError === name) state.activeError = null; else state.activeError = name;
        this.setState(state);
    }

    handleGrammarChange(text) {
        const state = this.state;
        const clause = state.clause;
        if (text !== state.grammar) {
            state.grammar = text;
            try {
                state.status = 'changed';
                state.data = JSON.stringify(clause.getData(),null,2);
                state.log.text = 'Grammar change successful!';
                if (state.data !== 'null') {
                    const template = clause.getTemplate();
                    clause.getTemplate().buildGrammar(text);
                    const changes = Utils.generateText(clause,state.data,state.log);
                    if (changes.log.text.indexOf('successful') === -1) {
                        throw new Error('Error generating text from this new grammar');
                    }
                    this.setState(changes);
                }
            } catch (error1) {
                try {
                    console.log('Error building grammar' + error1.message);
                    state.status = 'changed';
                    const template = clause.getTemplate();
                    template.buildGrammar(text);
                    state.log.text = '[Change Template] ' + error1.message;
                    this.setState(Utils.parseSample(clause, state.text, state.log));
                } catch (error2) {
                    state.log.text = '[Change Template] ' + error2.message;
                    this.setState(state);
                }
            }
        }
    }

    handleCompileChange(text) {
        // Compiled code should not be changed
    }

    handleRequestChange(text) {
        const state = this.state;
        if (updateRequest(state.clause,state.request,text)) {
            state.status = 'changed';
        }
        state.request = text;
        return this.setState(state);
    }
    handleResponseChange(text) {
        // Response should not be changed
    }
    handleStateChange(text) {
        const state = this.state;
        state.cstate = text;
        return this.setState(state); 
    }
    handleEmitChange(text) {
        // Emit should not be changed
    }

    handleModelChange(editor,name,model) {
        const state = this.state;
        const clause = state.clause;
        const oldmodel = state.model;
        var newmodel = [];
        let modelfails = false;
        for (const m of oldmodel) {
            if (m.name === name) {
                try {
                    if (Utils.updateModel(clause,name,m.content,model,state.grammar)) {
                        state.status = 'changed';
                        state.log.model = 'Load model successful';
                    }
                } catch (error) {
                    modelfails = true;
                    console.log('ERROR!' + error.message);
                    state.log.model = 'Cannot load model: ' + error.message;
                }
                newmodel.push({name : name, content: model });
            } else {
                newmodel.push({name : m.name, content: m.content });
            }
        }
        state.model = newmodel;
        this.setState(state);
        if (!modelfails) {
            state.log.model = 'Model loaded successfully';
            try {
                this.setState(Utils.parseSample(clause, state.text, state.log));
                try {
                    this.setState(Utils.compileLogic(null,state.logic,state.model,state.markers,state.log));
                } catch (error) {
                    this.setState(state);
                }
            } catch (error) {
                this.setState(state);
            }
        } else {
            this.setState(state);
        }
    }

    handleJSONChange(data) {
        const state = this.state;
        const clause = state.clause;
        const log = state.log;
        if (data !== null) {
            this.setState(Utils.generateText(clause, data, log));
        }
    }

    handleLogicChange(editor,name,logic) {
        const state = this.state;
        const clause = state.clause;
        const oldlogic = state.logic;
        var newlogic = [];
        for (const m of oldlogic) {
            if (m.name === name) {
                try {
                    if (Utils.updateLogic(clause,name,logic)) {
                        state.status = 'changed';
                    }
                } catch (error) {
                    state.log.logic = 'Cannot compile new logic' + error.message;
                }
                newlogic.push({name : name, content: logic });
            } else {
                newlogic.push({name : m.name, content: m.content });
            }
        }
        this.setState(Utils.parseSample(clause, state.text, state.log));
        this.setState(Utils.compileLogic(editor,newlogic,state.model,state.markers,state.log));
    }

    handleErgoMounted(editor) {
        const state = this.state;
        // Refresh markers
        state.markers = [];
        state.markersSource.forEach(marker => state.markers.push(editor.markText(marker.start, marker.end, marker.kind)));
    }

    handleModelMounted(editor) {
    }

    handleRunLogic() {
        // XXX Should check whether the NL parses & the logic compiles & the state/request are valid JSON first
        const state = this.state;
        try {
            const compiledLogic = state.clogic.compiledLinked;
            const contract = JSON.parse(state.data);
            const request = JSON.parse(state.request);
            const cstate = JSON.parse(state.cstate);
            const response = Utils.runLogic(compiledLogic,contract,request,cstate);
            if (response.hasOwnProperty('left')) {
                state.log.execute = 'Execution successful!';
                state.response = JSON.stringify(response.left.response,null,2);
                state.cstate = JSON.stringify(response.left.state,null,2);
                state.emit = JSON.stringify(response.left.emit,null,2);
            } else {
                state.response = 'null';
                state.cstate = 'null';
                state.emit = '[]';
                state.log.execute = '[Ergo Error]' + JSON.stringify(response.right);
            }
        } catch (error){
            state.response = 'null';
            state.cstate = 'null';
            state.emit = '[]';
            state.log.execute = '[Error Executing Template] ' + JSON.stringify(error.message);
        }
        this.setState(state);
    }

    handleInitLogic() {
        // XXX Should check whether the NL parses & the logic compiles & the state/request are valid JSON first
        const state = this.state;
        try {
            console.log('Initializing contract');
            const compiledLogic = state.clogic.compiledLinked;
            const contract = JSON.parse(state.data);
            const response = Utils.runInit(compiledLogic,contract);
            if (response.hasOwnProperty('left')) {
                state.log.execute = 'Execution successful!';
                state.response = JSON.stringify(response.left.response,null,2);
                state.cstate = JSON.stringify(response.left.state,null,2);
                state.emit = JSON.stringify(response.left.emit,null,2);
            } else {
                state.response = 'null';
                state.cstate = 'null';
                state.emit = '[]';
                state.log.execute = '[Ergo Error]' + JSON.stringify(response.right);
            }
        } catch (error){
            state.response = 'null';
            state.cstate = 'null';
            state.emit = '[]';
            state.log.execute = '[Error Executing Template] ' + JSON.stringify(error.message);
        }
        this.setState(state);
    }

    loadTemplateLibrary() {
        const templateLibrary = new TemplateLibrary();
        const promisedIndex =
              templateLibrary.getTemplateIndex({latestVersion: true, ciceroVersion: ciceroVersion});
        return promisedIndex.then((templateIndex) => {
            var templates = [];
            for(var t in templateIndex) {
                templates.push({'key':t, 'value':'ap://'+t+'#hash', 'text':t});
            }
            this.setState({templates:templates});
        });
    }

    loadTemplateFromUrl(templateURL) {
        let state = this.state;
        state.loading = true;
        this.setState(state);
        console.log('Loading template: ' + templateURL);
        let promisedTemplate;
        try {
            promisedTemplate = Template.fromUrl(templateURL);
        } catch (error) {
            console.log('LOAD FAILED!' + error.message); // Error!
            this.handleLoadingFailed(error.message);
            return false;
        };
        promisedTemplate.then((template) => { 
            state.templateURL = templateURL;
            state.clause = new Clause(template);
            state.templateName = state.clause.getTemplate().getMetadata().getName();
            state.templateVersion = state.clause.getTemplate().getMetadata().getVersion();
            state.templateType = state.clause.getTemplate().getMetadata().getTemplateType();
            state.package = JSON.stringify(template.getMetadata().getPackageJson(), null, 2);
            state.grammar = template.getTemplatizedGrammar();
            state.model = template.getModelManager().getModels();
            state.logic = template.getScriptManager().getLogic();
            state.text = template.getMetadata().getSamples().default;
            state.request = JSON.stringify(template.getMetadata().getRequest(), null, 2);
            state.data = 'null';
            state.status = 'loaded';
            this.setState(state);
            this.setState(Utils.compileLogic(null,state.logic,state.model,state.markers,state.log)); // Now returns changes, not setting the rest of the state
            this.handleModelChange(null,state,state.model);
            this.handleSampleChange(state.text);
            this.handleLogicChange(null,state,state.logic);
            this.handlePackageChange(state.package);
            this.handleInitLogic(); // Initializes the contract state
            state = this.state;
            state.loading = false;
            this.setState(state);
            return true;
        }, reason => {
            console.log('LOAD FAILED!' + reason.message); // Error!
            this.handleLoadingFailed(reason.message);
            return false;
        });
    }

    loadTemplateFromBuffer(buffer) {
        let state = this.state;
        state.loading = true;
        this.setState(state);
        console.log('Loading template from Buffer');
        let promisedTemplate;
        try {
            promisedTemplate = Template.fromArchive(buffer);
        } catch (error) {
            console.log('LOAD FAILED!' + error.message); // Error!
            this.handleLoadingFailed(error.message);
            return false;
        };
        promisedTemplate.then((template) => { 
            state.clause = new Clause(template);
            state.templateName = state.clause.getTemplate().getMetadata().getName();
            state.templateVersion = state.clause.getTemplate().getMetadata().getVersion();
            state.templateType = state.clause.getTemplate().getMetadata().getTemplateType();
            state.package = JSON.stringify(template.getMetadata().getPackageJson(), null, 2);
            state.grammar = template.getTemplatizedGrammar();
            state.model = template.getModelManager().getModels();
            state.logic = template.getScriptManager().getLogic();
            state.text = template.getMetadata().getSamples().default;
            state.request = JSON.stringify(template.getMetadata().getRequest(), null, 2);
            state.data = 'null';
            state.status = 'loaded';
            this.setState(state);
            this.setState(Utils.compileLogic(null,state.logic,state.model,state.markers,state.log));
            this.handleModelChange(null,state,state.model);
            this.handleSampleChange(state.text);
            this.handleLogicChange(null,state,state.logic);
            this.handlePackageChange(state.package);
            this.handleInitLogic(); // Initializes the contract state
            state = this.state;
            state.loading = false;
            this.setState(state);
            return true;
        }, reason => {
            console.log('LOAD FAILED!' + reason.message); // Error!
            this.handleLoadingFailed(reason.message);
            return false;
        });
    }

    componentDidMount() {
        this.loadTemplateLibrary().then(() => {
            if (!this.loadTemplateFromUrl(Utils.initUrl(DEFAULT_TEMPLATE))) {
                this.loadTemplateFromUrl(DEFAULT_TEMPLATE);
            }
        });
    }
    componentDidUpdate () {
        if (this.state.status === 'changed') {
            window.onbeforeunload = () => true;
        } else {
            window.onbeforeunload = undefined;
        }
    }
    handleItemClick(e, { name }) {
        const state = this.state;
        state.activeItem = name;
        this.setState(state);
    }
    render() {
        const { text, grammar, model, logic, clogic, log, data, request, cstate, response, emit, loading } = this.state;
        const legalTabs = () => (
            <div>
              <Menu attached='top' tabular>
                <Menu.Item
                  name='template'
                  active={this.state.activeLegal === 'template'}
                  onClick={this.handleLegalTabChange}>Template</Menu.Item>
                <Menu.Item
                  name='sample'
                  active={this.state.activeLegal === 'sample'}
                  onClick={this.handleLegalTabChange}
                >Test Contract</Menu.Item>
                <Menu.Item href='https://docs.accordproject.org/docs/cicero-concepts.html#template-grammar' target='_blank'
                  position='right'>
                  <Icon name='info'/>
                </Menu.Item>
              </Menu>
              { this.state.activeLegal === 'template' ?
                <Tab.Pane attached='bottom'>
                  <GrammarInput
                    grammar={grammar}
                    handleTextChange={this.handleGrammarChange}/>
                </Tab.Pane> :
                this.state.activeLegal === 'sample' ?
                <ParseForm text={text} grammar={grammar} log={log.text} data={data}
                           handleSampleChange={this.handleSampleChange}
                           handleJSONChange={this.handleJSONChange}/> : null }
            </div>
        );
        const logicTabs = () => (
            <div>
              <Menu attached='top' tabular>
                <Menu.Item
                  name='ergo'
                  active={this.state.activeLogic === 'ergo'}
                  onClick={this.handleLogicTabChange}>Ergo</Menu.Item>
                <Menu.Item
                  name='execution'
                  active={this.state.activeLogic === 'execution'}
                  onClick={this.handleLogicTabChange}
                >Test Execution</Menu.Item>
                <Menu.Item href='https://docs.accordproject.org/docs/cicero-concepts.html#template-logic' target='_blank'
                  position='right'>
                  <Icon name='info'/>
                </Menu.Item>
              </Menu>
              { this.state.activeLogic === 'ergo' ?
                <Tab.Pane attached='bottom'>
                  <LogicForm logic={logic}
                             handleErgoMounted={this.handleErgoMounted}
                             handleLogicChange={this.handleLogicChange}/>
                </Tab.Pane> :
                this.state.activeLogic === 'execution' ?
                <ExecuteForm request={request} cstate={cstate} response={response} emit={emit}
                             handleRequestChange={this.handleRequestChange}
                             handleStateChange={this.handleStateChange}
                             handleResponseChange={this.handleResponseChange}
                             handleEmitChange={this.handleEmitChange}
                             handleRunLogic={this.handleRunLogic}
                             handleInitLogic={this.handleInitLogic}/> : null }
            </div>
        );
        const modelTabs = () => (
            <div>
              <Menu attached='top' tabular>
                <Menu.Item
                  name='model'
                  active={this.state.activeModel === 'model'}
                  onClick={this.handleModelTabChange}
                >Model</Menu.Item>
                <Menu.Item href='https://docs.accordproject.org/docs/cicero-concepts.html#template-model' target='_blank'
                  position='right'>
                  <Icon name='info'/>
                </Menu.Item>
              </Menu>
              { this.state.activeModel === 'model' ?
                <Tab.Pane>
                  <ModelForm model={model} handleModelChange={this.handleModelChange}
                             handleErgoMounted={this.handleModelMounted}/>
                </Tab.Pane> : null }
            </div>
        );
        const metaTabs = () => (
            <div>
              <Menu attached='top' tabular>
                <Menu.Item
                  name='readme'
                  active={this.state.activeMeta === 'readme'}
                  onClick={this.handleMetaTabChange}
                >README</Menu.Item>
                <Menu.Item
                  name='package'
                  active={this.state.activeMeta === 'package'}
                  onClick={this.handleMetaTabChange}>package.json</Menu.Item>
                <Menu.Item href='https://docs.accordproject.org/docs/cicero-concepts.html#template-library' target='_blank'
                  position='right'>
                  <Icon name='info'/>
                </Menu.Item>
              </Menu>
              { this.state.activeMeta === 'readme' ?
                <Tab.Pane attached='bottom'>
                  <GrammarInput
                    grammar={this.state.clause ? this.state.clause.getTemplate().getMetadata().getREADME() : 'null'}
                    handleTextChange={this.handleREADMEChange}/>
                </Tab.Pane> : this.state.activeMeta === 'package' ?
                <Tab.Pane attached='bottom'>
                  <JsonInput
                    json={this.state.package}
                    handleJSONChange={this.handlePackageChange}/>
                </Tab.Pane> : null }
            </div>
        );
        const bottomMenu = () =>
              (<Container fluid>
                 <Divider hidden/>
                 <div className='ui bottom sticky'>
                   { this.state.activeError === 'parse' ? <ParseStatus log={log}/> :
                     this.state.activeError === 'logic' ? <LogicStatus log={log}/> :
                     this.state.activeError === 'model' ? <ModelStatus log={log}/> :
                     this.state.activeError === 'meta' ? <MetaStatus log={log}/> :
                     this.state.activeError === 'execute' ? <ExecuteStatus log={log}/> : null }
                   <Menu fixed='bottom' color={ anyFailure(this.state.log) ? 'red' : 'grey' } inverted>
                     <Menu.Item header>
                       <AllStatusLabel log={this.state.log}/>
                     </Menu.Item>
                     { parseFailure(this.state.log) ?
                       <Menu.Item
                         name='parse'
                         active={this.state.activeError === 'parse'}
                         onClick={this.handleErrorTabChange}>
                         <Icon name='warning sign'/>Contract Text
                       </Menu.Item> : null }
                     { logicFailure(this.state.log) ?
                       <Menu.Item
                         name='logic'
                         active={this.state.activeError === 'logic'}
                         onClick={this.handleErrorTabChange}>
                         <Icon name='warning sign'/>Logic
                       </Menu.Item> : null }
                     { modelFailure(this.state.log) ?
                       <Menu.Item
                         name='model'
                         active={this.state.activeError === 'model'}
                         onClick={this.handleErrorTabChange}>
                         <Icon name='warning sign'/>Model
                       </Menu.Item> : null }
                     { metaFailure(this.state.log) ?
                       <Menu.Item
                         name='meta'
                         active={this.state.activeError === 'meta'}
                         onClick={this.handleErrorTabChange}>
                         <Icon name='warning sign'/>Metadata
                       </Menu.Item> : null }
                     { templateFailure(log) && otherFailure(log) ?
                       <Menu.Item header>
                         &middot;
                       </Menu.Item> : null }
                       { executeFailure(this.state.log) ?
                       <Menu.Item
                         name='execute'
                         active={this.state.activeError === 'execute'}
                         onClick={this.handleErrorTabChange}>
                         <Icon name='warning sign'/>Execution
                       </Menu.Item> : null }
                 </Menu>
                 </div>
               </Container>);
        const viewMenu = () =>
              (<Menu fluid vertical pointing>
                 <Menu.Item name='legal' active={this.state.activeItem === 'legal'} onClick={this.handleItemClick}>
                   Contract Text
                 </Menu.Item>
                 <Menu.Item name='model' active={this.state.activeItem === 'model'} onClick={this.handleItemClick}>
                   Model
                 </Menu.Item>
                 <Menu.Item name='logic' active={this.state.activeItem === 'logic'} onClick={this.handleItemClick}>
                   Logic
                 </Menu.Item>
                 <Menu.Item name='metadata' active={this.state.activeItem === 'metadata'} onClick={this.handleItemClick}>
                   Metadata
                 </Menu.Item>
               </Menu>);
        const templateForm = () =>
              (  <Card fluid>
                   <Card.Content>
                     <Card.Header>Current Template</Card.Header>
                     <StatusLabel log={this.state.log} status={this.state.status}/>
                   </Card.Content>
                   <Card.Content>
                     <Form>
                       <Form.Group inline>
                         <Form.Field
                           control={Radio}
                           label='full contract'
                           value='contract'
                           checked={this.state.templateType === 'contract'}
                           onChange={this.handleTypeChange}
                         />
                         <Form.Field
                           control={Radio}
                           label='single clause'
                           value='clause'
                           checked={this.state.templateType === 'clause'}
                           onChange={this.handleTypeChange}
                         />
                       </Form.Group>
                       <Form.Field control={Input} label='Name'
                                   onChange={this.handleNameChange}
                                   value={
                                       this.state.templateName
                                   }>
                       </Form.Field>
                       <Form.Field control={Input} label='Version'
                                   onChange={this.handleVersionChange}
                                   value={
                                       this.state.templateVersion
                                   }>
                       </Form.Field>
                     </Form>
                   </Card.Content>
                   <Card.Content>
                     <ExportButton handleStatusChange={this.handleStatusChange} clause={this.state.clause}/>
                     <Confirm content='Your template has been edited, are you sure you want to discard those changes? You can save your current template by using the Export button.' confirmButton="I am sure" cancelButton='Cancel' open={this.state.confirmreset.flag} onCancel={this.handleDiscardAborted} onConfirm={this.handleDiscardConfirmed} />
                     <DiscardButton handleDiscardChange={this.handleDiscardChange}/>
                   </Card.Content>
                 </Card>
              );
        const dimmableContainer = () => (
              <Container fluid style={{ marginTop: '7em', marginBottom: '9em' }}>
                <Confirm header='Could not load template'
                         content={this.state.log.loading}
                         confirmButton={null}
                         cancelButton='Cancel'
                         open={this.state.loadingFailed}
                         onCancel={this.handleLoadingFailedConfirm} />
                <Dimmer.Dimmable dimmed={loading}>
                  <Dimmer active={loading} inverted>
                    <Loader>Loading Template</Loader>
                  </Dimmer>
                  <Grid padded>
                    <Grid.Row>
                      <Grid.Column width={4}>
                        <Grid>
                          <Grid.Row>
                            <Grid.Column>
                              {viewMenu()}
                            </Grid.Column>
                          </Grid.Row>
                          <Grid.Row>
                            <Grid.Column>
                              {templateForm()}
                            </Grid.Column>
                          </Grid.Row>
                        </Grid>
                      </Grid.Column>
                      <Grid.Column width={12}>
                        { this.state.activeItem === 'legal' ? legalTabs()
                          : this.state.activeItem === 'logic' ? logicTabs()
                          : this.state.activeItem === 'model' ? modelTabs()
                          : metaTabs() }
                      </Grid.Column>
                    </Grid.Row>
                  </Grid>
                </Dimmer.Dimmable>
              </Container>
        );
        return (
            <div>
                <TopMenu
                    loadTemplateFromBuffer={this.loadTemplateFromBuffer}
                    loadTemplateFromUrl={this.loadTemplateFromUrl}
                    status={this.state.status}
                    templates={this.state.templates}
                />
              {dimmableContainer()}
              {bottomMenu()}
            </div>
        );
    }
}
export default TemplateStudio;

