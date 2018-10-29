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

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import InputGrammar from '../presentational/InputGrammar';
import InputJson from '../presentational/InputJson';
import ModelForm from '../tabs/ModelForm';
import LogicForm from '../tabs/LogicForm';
import CompileForm from '../tabs/CompileForm';
import ParseForm from '../tabs/ParseForm';
import ExecuteForm from '../tabs/ExecuteForm';
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
} from '../status/Status';
import Options from '../status/Options';
import {
    UploadButton,
    ResetButton,
    SaveButton,
    NewButton
} from '../status/TemplateTab';
import { Template, Clause } from '@accordproject/cicero-core';
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
    Dropdown,
    Menu,
    Modal,
    Icon,
    Card,
    Confirm,
    Dimmer,
    Loader,
    Segment
} from 'semantic-ui-react';

import ModelFile from 'composer-concerto/lib/introspect/modelfile';
import Ergo from '@accordproject/ergo-compiler/lib/ergo.js';
import moment from 'moment';
import semver from 'semver';

import * as templateLibrary from '@accordproject/cicero-template-library/build/template-library.json';
import * as ciceroPackageJson from '@accordproject/cicero-core/package.json';
import * as ergoPackageJson from '@accordproject/ergo-compiler/package.json';

const ciceroVersion = ciceroPackageJson.version;
const ergoVersion = ergoPackageJson.version;

const DEFAULT_TEMPLATE = 'helloworld@0.7.0';

function getTemplates() {
    var templates = [];
    for(var t in templateLibrary.default) {
        let currentT = t;
        let currentTemplate = templateLibrary.default[t];
        let currentName = currentTemplate.name;
        let currentVersion = currentTemplate.version;
        // Keep only the last version for any given template
        for (var t2 in templateLibrary.default) {
            const newTemplate = templateLibrary.default[t2];
            const newName = newTemplate.name;
            const newVersion = newTemplate.version;
            if (newName === currentName && semver.gt(newVersion, currentVersion)) {
                currentT = t2;
                currentTemplate = newTemplate;
                currentName = currentTemplate.name;
                currentVersion = currentTemplate.version;
            }
        }
        // Make sure it's the right ciceroVersion and uses Ergo
        if (semver.satisfies(ciceroVersion,currentTemplate.ciceroVersion) && currentTemplate.language === 0) {
            if (templates.filter(t => t.key === currentT).length < 1)
                templates.push({'key':currentT, 'value':currentT, 'text':currentT});
        }
    }
    return templates;
}
const templates = getTemplates();

function parseSample(input_state,text) {
    const state = input_state;
    const clause = input_state.clause;
    try {
        clause.parse(text);
        state.data = JSON.stringify(clause.getData(),null,2);
        state.log.text = 'Parse successful!',
        state.text = text;
    } catch (error){
        state.data = 'null';
        state.log.text = '[Parse Contract] ' + error.message;
        state.text = text;
    }
    return state;
}

function generateText(input_state,data) {
    const state = input_state;
    try {
        const dataContent = JSON.parse(data);
        const clause = input_state.clause;
        clause.setData(dataContent);
        const text = clause.generateText();
        state.text = text;
        state.data = data;
        if (updateSample(clause,text)) {
            state.status = 'changed';
        }
        state.log.text = 'GenerateText successful!';
    } catch (error){
        state.data = data;
        state.log.text = '[Instantiate Contract] ' + error.message;
    }
    return state;
}

function compileLogic(editor,logic,state) {
    const model = state.model;
    try {
        const compiledLogic = Ergo.compileToJavaScript(logic,model,'cicero',false);
        state.markers.forEach(marker => marker.clear());
        state.markers = [];
        if (compiledLogic.hasOwnProperty('error')) {
            const error = compiledLogic.error;
            state.log.logic = error.verbose;
            if (editor) {
                console.log('ERROR'+JSON.stringify(error));
                state.markers.push
                (editor.markText({line:error.locstart.line-1,ch:error.locstart.character},
                                 {line:error.locend.line-1,ch:error.locend.character+1},
                                 {className: 'syntax-error', title: error.verbose}));
            }
        } else {
            const compiledLogicLinked = Ergo.compileToJavaScript(logic,model,'cicero',true);
            state.clogic = { compiled: compiledLogic.success, compiledLinked : compiledLogicLinked.success };
            state.log.logic = 'Compilation successful';
        }
    } catch (error) {
        state.log.logic = 'Compilation error ' + error.message;
    }
    state.logic = logic;
    return state;
}

function runLogic(compiledLogic,contract,request,cstate) {
	  const params = { 'contract': contract, 'request': request, 'state' : cstate, 'emit': [], 'now': moment('2018-05-21') };
	  const clauseCall = 'dispatch(params);'; // Create the clause call
    const response = eval(compiledLogic + clauseCall); // Call the logic
    return response;
}

function runInit(compiledLogic,contract) {
	  const params = { 'contract': contract, 'request': null, 'state' : null, 'emit': [], 'now': moment('2018-05-21') };
	  const clauseCall = 'init(params);'; // Create the clause call
    const response = eval(compiledLogic + clauseCall); // Call the logic
    return response;
}

function updateSample(clause,sample) {
    //console.log('Updating sample' + sample);
    const template = clause.getTemplate();
    const samples = template.getMetadata().getSamples();
    if (samples.default !== sample) {
        samples.default = sample;
        template.setSamples(samples);
        return true;
    } else {
        return false;
    }
}
function updateModel(clause,name,oldcontent,content) {
    const modelManager = clause.getTemplate().getModelManager();
    if (oldcontent !== content) {
        modelManager.validateModelFile(content,name);
        modelManager.updateModelFile(content,name,true);
        return true;
    } else {
        return false;
    }
}
function updateLogic(clause,name,content) {
    const scriptManager = clause.getTemplate().getScriptManager();
    if (scriptManager.getScript(name).getContents() !== content) {
        scriptManager.modifyScript(name,'.ergo',content);
        return true;
    } else {
        return false;
    }
}

class FormContainer extends Component {
    constructor() {
        super();
        this.state = {
            templateName: null,
            clause: null,
            package: 'null',
            readme: '',
            text: `[Please Select a Sample Template]`,
            data: 'null',
            log: { text: 'Not yet parsed.',
                   model: 'Not yet validate',
                   logic: 'Not yet compiled.',
                   meta: 'Not yet loaded.',
                   execute: '' },
            grammar: `[Please Select a Sample Template]`,
            model: `[Please Select a Sample Template]`,
            logic: `[Please Select a Sample Template]`,
            request: 'null',
            cstate: 'null',
            response: JSON.stringify(null, null, 2),
            emit: '[]',
            options: { lineNumbers: false },
            activeItem: 'metadata',
            activeLegal: 'template',
            activeModel: 'model',
            activeLogic: 'ergo',
            activeMeta: 'readme',
            activeError: null,
            clogic: { compiled: '', compiledLinked: '' },
            status: 'empty',
            loading: false,
            confirm: { flag: false, temp: null },
            confirmreset: { flag: false, temp: null },
            markers: [] // For code mirror marking
        };
        this.handleStatusChange = this.handleStatusChange.bind(this);
        this.handleResetChange = this.handleResetChange.bind(this);
        this.handleResetConfirmed = this.handleResetConfirmed.bind(this);
        this.handleResetAborted = this.handleResetAborted.bind(this);
        this.handlePackageChange = this.handlePackageChange.bind(this);
        this.handleREADMEChange = this.handleREADMEChange.bind(this);
        this.handleSampleChange = this.handleSampleChange.bind(this);
        this.handleGrammarChange = this.handleGrammarChange.bind(this);
        this.handleModelChange = this.handleModelChange.bind(this);
        this.handleJSONChange = this.handleJSONChange.bind(this);
        this.handleLogicChange = this.handleLogicChange.bind(this);
        this.handleRunLogic = this.handleRunLogic.bind(this);
        this.handleInitLogic = this.handleInitLogic.bind(this);
        this.handleCompileChange = this.handleCompileChange.bind(this);
        this.handleSelectTemplate = this.handleSelectTemplate.bind(this);
        this.handleSelectTemplateConfirmed = this.handleSelectTemplateConfirmed.bind(this);
        this.handleSelectTemplateAborted = this.handleSelectTemplateAborted.bind(this);
        this.loadTemplate = this.loadTemplate.bind(this);
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
    }

    handleStatusChange(status) {
        const state = this.state;
        state.status = status;
        this.setState(state);
    }
    handleResetChange() {
        const state = this.state;
        if (state.status === 'changed') {
            state.confirmreset = { flag: true, temp: null };
            this.setState(state);
        } else {
            this.loadTemplate(this.state.templateName);
        }
    }
    handleResetConfirmed() {
        const state = this.state;
        state.confirmreset = { flag: false, temp: null };
        this.loadTemplate(this.state.templateName);
    }
    handleResetAborted() {
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
            state.log.meta = 'package.json change successful!';
            this.setState(state);
        } catch (error){
            console.log('ERROR'+JSON.stringify(error.message));
            state.package = text;
            state.log.meta = '[Change Template package.json] ' + error;
            this.setState(state);
        }
    }
    handleNameChange(e, { name, value }) {
        const state = this.state;
        try {
            const packageJson = JSON.parse(state.package);
            packageJson.name = value;
            state.clause.getTemplate().setPackageJson(packageJson);
            state.package = JSON.stringify(packageJson,null,2);
            state.log.meta = 'Template Name change successful!';
            this.setState(state);
        } catch (error){
            console.log('ERROR'+JSON.stringify(error.message));
            state.log.meta = '[Change Template Name] ' + error;
            this.setState(state);
        }
    }
    handleVersionChange(e, { name, value }) {
        const state = this.state;
        try {
            const packageJson = JSON.parse(state.package);
            packageJson.version = value;
            state.clause.getTemplate().setPackageJson(packageJson);
            state.package = JSON.stringify(packageJson,null,2);
            state.log.meta = 'Template version change successful!';
            this.setState(state);
        } catch (error){
            console.log('ERROR'+JSON.stringify(error.message));
            state.log.meta = '[Change Template Version] ' + error;
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
        const clause = state.clause;
        if (updateSample(clause,text)) {
            state.status = 'changed';
        }
        this.setState(parseSample(this.state, text));
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
        if (text !== state.grammar) {
            try {
                state.data = JSON.stringify(state.clause.getData(),null,2);
                state.log.text = 'Grammar change successful!';
                state.grammar = text;
                state.status = 'changed';
                if (state.data !== 'null') {
                    const template = state.clause.getTemplate();
                    state.clause.getTemplate().buildGrammar(text);
                    this.setState(generateText(state,state.data));
                }
            } catch (error){
                state.data = 'null';
                state.log.text = '[Change Template] ' + error.log;
                state.grammar = text;
                this.setState(state);
            }
        }
    }

    handleCompileChange(text) {
        // Compiled code should not be changed
    }

    handleRequestChange(text) {
        const state = this.state;
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
        const oldmodel = state.model;
        var newmodel = [];
        let modelfails = false;
        for (const m of oldmodel) {
            if (m.name === name) {
                try {
                    if (updateModel(state.clause,name,m.content,model)) {
                        state.status = 'changed';
                        state.log.model = 'Load model successful';
                    }
                } catch (error) {
                    modelfails = true;
                    console.log('ERROR!' + error.message);
                    state.log.model = 'Cannot load model' + error.message;
                }
                newmodel.push({name : name, content: model });
            } else {
                newmodel.push({name : m.name, content: m.content });
            }
        }
        state.model = newmodel;
        if (!modelfails) {
            state.log.model = 'Model loaded successfully';
            this.setState(parseSample(state, state.text));
            this.setState(compileLogic(editor,state.logic,state));
        } else {
            this.setState(state);
        }
    }

    handleJSONChange(data) {
        const state = this.state;
        if (data !== null) {
            this.setState(generateText(state, data));
        }
    }

    handleLogicChange(editor,name,logic) {
        const state = this.state;
        const oldlogic = state.logic;
        var newlogic = [];
        for (const m of oldlogic) {
            if (m.name === name) {
                try {
                    if (updateLogic(state.clause,name,logic)) {
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
        this.setState(parseSample(state, state.text));
        this.setState(compileLogic(editor,newlogic,state));
    }

    handleRunLogic() {
        // XXX Should check whether the NL parses & the logic compiles & the state/request are valid JSON first
        const state = this.state;
        try {
            const compiledLogic = state.clogic.compiledLinked;
            const contract = JSON.parse(state.data);
            const request = JSON.parse(state.request);
            const cstate = JSON.parse(state.cstate);
            const response = runLogic(compiledLogic,contract,request,cstate);
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
            const response = runInit(compiledLogic,contract);
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

    handleSelectTemplateConfirmed() {
        const state = this.state;
        const data = state.confirm.temp;
        state.confirm = { flag: false, temp: null };
        this.loadTemplate(data);
    }
    handleSelectTemplateAborted() {
        const state = this.state;
        state.confirm = { flag: false, temp: null };
        this.setState(state);
    }
    handleSelectTemplate(event, data) {
        const state = this.state;
        if (state.status === 'changed') {
            state.confirm = { flag: true, temp: data.value };
            this.setState(state);
        } else {
            this.loadTemplate(data.value);
        }
    }

    loadTemplate(templateName) {
        let state = this.state;
        state.loading = true;
        this.setState(state);
        const templateUrl = 'ap://'+templateName+'#hash';
        Template.fromUrl(templateUrl).then((template) => { 
            console.log('Loading template: ' + templateUrl);
            state.templateName = templateName;
            state.clause = new Clause(template);
            state.package = JSON.stringify(template.getMetadata().getPackageJson(), null, 2);
            state.grammar = template.getTemplatizedGrammar();
            state.model = template.getModelManager().getModels();
            state.logic = template.getLogic();
            state.text = template.getMetadata().getSamples().default;
            state.request = JSON.stringify(template.getMetadata().getRequest(), null, 2);
            state.log.text = 'Not yet parsed.';
            state.data = 'null';
            state.status = 'loaded';
            state = compileLogic(null,state.logic, state);
            this.setState(state);
            this.handleModelChange(null,state,state.model);
            this.handleSampleChange(state.text);
            this.handleLogicChange(null,state,state.logic);
            this.handlePackageChange(state.package);
            this.handleInitLogic(); // Initializes the contract state
            state = this.state;
            state.loading = false;
            this.setState(state);
        });
    }

    componentDidMount() {
        this.loadTemplate(DEFAULT_TEMPLATE);
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
                  <InputGrammar
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
                >Data Model</Menu.Item>
                <Menu.Item href='https://docs.accordproject.org/docs/cicero-concepts.html#template-model' target='_blank'
                  position='right'>
                  <Icon name='info'/>
                </Menu.Item>
              </Menu>
              { this.state.activeModel === 'model' ?
                <Tab.Pane>
                  <ModelForm model={model} handleModelChange={this.handleModelChange}/>
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
                  <InputGrammar
                    grammar={this.state.clause ? this.state.clause.getTemplate().getMetadata().getREADME() : 'null'}
                    handleTextChange={this.handleREADMEChange}/>
                </Tab.Pane> : this.state.activeMeta === 'package' ?
                <Tab.Pane attached='bottom'>
                  <InputJson
                    json={this.state.package}
                    handleJSONChange={this.handlePackageChange}/>
                </Tab.Pane> : null }
            </div>
        );
        const ModalAbout = () => (
            <Modal trigger={<Menu.Item>About</Menu.Item>}>
              <Modal.Header>Accord Project &middot; Template Studio (Experimental)</Modal.Header>
              <Modal.Content>
                <Modal.Description>
                  <Header>Welcome!</Header>
                  <p>This template studio lets you edit and execute legal contract templates built with the <a href='https://accordproject.org/' target='_blank'>Accord Project</a>.</p>
                  <p>It is open-source and under active development. Contributions and bug reports are welcome on <a href='https://github.com/accordproject/template-studio' target='_blank'>GitHub</a>.</p>
                </Modal.Description>
                <Divider/>
                <Modal.Description>
                  <Header>Getting started</Header>
                  <p>Search a template from the <a href='https://templates.accordproject.org' target='_blank'>Accord Project template library</a> (Search box at the top)</p>
                  <p>Chose whether to edit the Natural Language or the Contract Logic (Tab on the left)</p>
                  <p>Edit the contract template and try it on a sample contract</p>
                  <p>Edit the Ergo contract logic and try it by executing a simple request</p>
                </Modal.Description>
                <Divider/>
                <Modal.Description>
                  <Header>Version Information</Header>
                  <p>Cicero {ciceroVersion}</p>
                  <p>Ergo {ergoVersion}</p>
                </Modal.Description>
              </Modal.Content>
            </Modal>
        );
        const topMenu = () =>
              (<Menu fixed='top' inverted>
                 <Container>
                   <Menu.Item header>
                     <Image size='mini' href='https://www.accordproject.org' src='static/img/accordlogo.png' style={{ marginRight: '1.5em' }} target='_blank'/>
                     Accord Project &middot; Template Studio
                   </Menu.Item>
                   <Menu.Item>
                     <Confirm content='Your template has been edited, are you sure you want to load a new one? You can save your current template by using the Save button.' confirmButton="I am sure" cancelButton='Cancel' open={this.state.confirm.flag} onCancel={this.handleSelectTemplateAborted} onConfirm={this.handleSelectTemplateConfirmed} />
                     <Dropdown icon='search'
                               placeholder='Search'
                               search
                               selection
                               options={templates}
                               onChange={this.handleSelectTemplate}/>
                     <Label color='grey' pointing='left'>Load template<br/>from library</Label>
                   </Menu.Item>
                   <Menu.Item position='right'>
                     <Dropdown item text='Help' simple position='right' direction='left'>
                       <Dropdown.Menu>
                         <ModalAbout/>
                         <Header as='h4'>Documentation</Header>
                         <Menu.Item href='https://docs.accordproject.org/' target='_blank'>
                           <Icon name='info'/> Accord Project Documentation
                         </Menu.Item>
                         <Menu.Item href='https://docs.accordproject.org/docs/ergo-lang.html' target='_blank'>
                           <Icon name='lab'/> Ergo Language Guide
                         </Menu.Item>
                       </Dropdown.Menu>
                     </Dropdown>
                   </Menu.Item>
                 </Container>
               </Menu>);
        const bottomMenu = () =>
              (<Container>
                 <Divider hidden/>
                 <div className='ui bottom sticky fixed'>
                   { this.state.activeError === 'parse' ? <ParseStatus log={log}/> :
                     this.state.activeError === 'logic' ? <LogicStatus log={log}/> :
                     this.state.activeError === 'model' ? <ModelStatus log={log}/> :
                     this.state.activeError === 'meta' ? <MetaStatus log={log}/> :
                     this.state.activeError === 'execute' ? <ExecuteStatus log={log}/> : null }
                   <Menu attached='bottom'>
                   <Container>
                     <Menu.Item header>
                       <AllStatusLabel log={this.state.log}/>
                     </Menu.Item>
                     { parseFailure(this.state.log) ?
                       <Menu.Item
                         name='parse'
                         active={this.state.activeError === 'parse'}
                         onClick={this.handleErrorTabChange}>
                         <Icon name='warning sign' color='red'/>Natural Language
                       </Menu.Item> : null }
                     { logicFailure(this.state.log) ?
                       <Menu.Item
                         name='logic'
                         active={this.state.activeError === 'logic'}
                         onClick={this.handleErrorTabChange}>
                         <Icon name='warning sign' color='red'/>Contract Logic
                       </Menu.Item> : null }
                     { modelFailure(this.state.log) ?
                       <Menu.Item
                         name='model'
                         active={this.state.activeError === 'model'}
                         onClick={this.handleErrorTabChange}>
                         <Icon name='warning sign' color='red'/>Data Model
                       </Menu.Item> : null }
                     { metaFailure(this.state.log) ?
                       <Menu.Item
                         name='meta'
                         active={this.state.activeError === 'meta'}
                         onClick={this.handleErrorTabChange}>
                         <Icon name='warning sign' color='red'/>Metadata
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
                         <Icon name='warning sign' color='red'/>Execution
                       </Menu.Item> : null }
                   </Container>
                 </Menu>
                 </div>
               </Container>);
        const viewMenu = () =>
              (<Menu floated='right' compact secondary vertical pointing>
                 <Menu.Item name='legal' active={this.state.activeItem === 'legal'} onClick={this.handleItemClick}>
                   Natural Language
                 </Menu.Item>
                 <Menu.Item name='model' active={this.state.activeItem === 'model'} onClick={this.handleItemClick}>
                   Data Model
                 </Menu.Item>
                 <Menu.Item name='logic' active={this.state.activeItem === 'logic'} onClick={this.handleItemClick}>
                   Contract Logic
                 </Menu.Item>
                 <Menu.Item name='metadata' active={this.state.activeItem === 'metadata'} onClick={this.handleItemClick}>
                   Metadata
                 </Menu.Item>
               </Menu>);
        const templateForm = () =>
              (  <Card>
                   <Card.Content>
                     <Card.Header>Current Template</Card.Header>
                     <StatusLabel log={this.state.log} status={this.state.status}/>
                   </Card.Content>
                   <Card.Content>
                     <Input label={{ basic: true, content: 'Name' }} fluid placeholder='Name'
                            onChange={this.handleNameChange}
                            value={
                                this.state.clause ? this.state.clause.getTemplate().getMetadata().getPackageJson().name : ''
                            }></Input>
                     <br/>
                     <Input label={{ basic: true, content: 'Version' }} fluid placeholder='Version'
                            onChange={this.handleVersionChange}
                            value={
                                this.state.clause ? this.state.clause.getTemplate().getMetadata().getPackageJson().version : ''
                            }></Input>
                     <br/>
                     <SaveButton handleStatusChange={this.handleStatusChange} clause={this.state.clause}/>
                     <Confirm content='Your template has been edited, are you sure you want to reset? You can save your current template by using the Save button.' confirmButton="I am sure" cancelButton='Cancel' open={this.state.confirmreset.flag} onCancel={this.handleResetAborted} onConfirm={this.handleResetConfirmed} />
                     <ResetButton handleResetChange={this.handleResetChange}/>
                   </Card.Content>
                 </Card>
              );
        const dimmableContainer = () => (
              <Container style={{ marginTop: '7em', marginBottom: '7em' }}>
                <Dimmer.Dimmable dimmed={loading}>
                  <Dimmer active={loading} inverted>
                    <Loader>Loading Template</Loader>
                  </Dimmer>
                  <Grid>
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
              {topMenu()}
              {dimmableContainer()}
              {bottomMenu()}
            </div>
        );
    }
}
export default FormContainer;

const wrapper = document.getElementById('create-article-form');
wrapper ? ReactDOM.render(<FormContainer />, wrapper) : false;
