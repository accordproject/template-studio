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

/* Default values */

const DEFAULT_TEMPLATE = `${ROOT_URI}/static/archives/helloworld@0.12.0.cta`;

/* Utilities */

import * as Utils from './Utils';
import _ from 'lodash';

/* Cicero */

import { TemplateLibrary, Template, Clause } from '@accordproject/cicero-core';

import * as ciceroPackageJson from '@accordproject/cicero-core/package.json';

const ciceroVersion = ciceroPackageJson.version;

/* React */

import React, { Component } from 'react';

/* Studio components */

import BottomMenu from './BottomMenu';
import DimmableContainer from './DimmableContainer';
import TopMenu from './TopMenu';

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
            clause: null,
            package: 'null',
            readme: '',
            text: '[Please Select a Sample Template]',
            data: 'null',
            log: defaultlog,
            grammar: '[Please Select a Sample Template]',
            model: '[Please Select a Sample Template]',
            logic: '[Please Select a Sample Template]',
            request: 'null',
            cstate: 'null',
            response: JSON.stringify(null, null, 2),
            emit: '[]',
            status: 'empty',
            loading: false,
            markers: [],
            editor: null,
        };
        this.handleErgoMounted = this.handleErgoMounted.bind(this);
        this._handleGrammarChange = this._handleGrammarChange.bind(this);
        const debouncedGrammarChange = _.debounce(this._handleGrammarChange, 1000, { maxWait: 5000 });
        this.handleGrammarChange = (text) => {
            this.setState({ grammar: text });
            debouncedGrammarChange();
        };
        this.handleInitLogic = this.handleInitLogic.bind(this);
        this.handleJSONChange = this.handleJSONChange.bind(this);
        this.handleLoadingSucceeded = this.handleLoadingSucceeded.bind(this);
        this.handleLoadingFailed = this.handleLoadingFailed.bind(this);
        this.handleLoadingFailedConfirm = this.handleLoadingFailedConfirm.bind(this);
        this._handleLogicChange = this._handleLogicChange.bind(this);
        const debouncedLogicChange = _.debounce(this._handleLogicChange, 1000, { maxWait: 5000 });
        this.handleLogicChange = (editor, name, logicText) => {
            const { clause, log, model, markers, status, logic } = this.state;
            const newLogic = [];
            let newStatus = status;
            let newLog = log.logic;
            logic.forEach((m) => {
                if (m.name === name) {
                    try {
                        if (Utils.updateLogic(clause, name, logicText)) {
                            newStatus = 'changed';
                        }
                    } catch (error) {
                        newLog = `Cannot compile new logic ${error.message}`;
                    }
                    newLogic.push({ name,
                                    content: logicText,
                                    markersSource: m.markersSource ? m.markersSource : [],
                                  });
                } else {
                    newLogic.push({ name: m.name, content: m.content, markersSource: m.markersSource });
                }
            });
            this.setState({editor: editor, logic:newLogic, clause, status: newStatus, log: {...log, logic:newLog }});
            debouncedLogicChange();
        };
        this._handleModelChange = this._handleModelChange.bind(this);
        const debouncedModelChange = _.debounce(this._handleModelChange, 1000, { maxWait: 5000 });
        this.handleModelChange = (editor, name, model) => {
            const clause = this.state.clause;
            const logicManager = clause.getTemplate().getLogicManager();
            const oldModel = this.state.model;
            const newModel = [];
            let modelFails = false;
            let changesModel;
            oldModel.forEach((m) => {
                if (m.name === name) {
                    changesModel = Utils.updateModel(logicManager, 'model/'+name, model, this.state.log);
                    newModel.push({ name,
                                    content: model,
                                    markersSource: m.markersSource ? m.markersSource : [],
                                  });
                } else {
                    newModel.push({ name: m.name, content: m.content, markersSource: m.markersSource });
                }
            });
            this.setState({...changesModel, editor: editor, clause, status:'changed', model: newModel});
            debouncedModelChange();
        };
        this.handleNameChange = this.handleNameChange.bind(this);
        this.handleVersionChange = this.handleVersionChange.bind(this);
        this.handlePackageChange = this.handlePackageChange.bind(this);
        this.handleREADMEChange = this.handleREADMEChange.bind(this);
        this.handleRequestChange = this.handleRequestChange.bind(this);
        this.handleRunLogic = this.handleRunLogic.bind(this);
        this.handleSampleChangeInit = this.handleSampleChangeInit.bind(this);
        this.handleSampleChange = this.handleSampleChange.bind(this);
        this.handleStateChange = this.handleStateChange.bind(this);
        this.handleStatusChange = this.handleStatusChange.bind(this);
        this.handleTypeChange = this.handleTypeChange.bind(this);
        this.loadTemplateLibrary = this.loadTemplateLibrary.bind(this);
        this.loadTemplateFromUrl = this.loadTemplateFromUrl.bind(this);
        this.loadTemplateFromBuffer = this.loadTemplateFromBuffer.bind(this);
    }

    async componentDidMount() {
        await this.loadTemplateLibrary();
        const initTemplate = await this.loadTemplateFromUrl(Utils.initUrl(DEFAULT_TEMPLATE));
        if (!initTemplate) {
            await this.loadTemplateFromUrl(DEFAULT_TEMPLATE);
        }
    }

    componentDidUpdate() {
        if (this.state.status === 'changed') {
            window.onbeforeunload = () => true;
        } else {
            window.onbeforeunload = undefined;
        }
    }

    handleLoadingFailed(message) {
        this.setState({
            loading: false,
            loadingFailed: true,
            log: {
                ...this.state.log,
                loading: message,
            },
        });
    }

    handleLoadingSucceeded() {
        this.setState({
            loading: false,
            status: 'loaded'
        });
    }

    handleLoadingFailedConfirm() {
        this.setState({
            log: {
                ...this.state.log,
                loading: 'Unknown Error',
            },
            loadingFailed: false,
        });
    }

    handleStatusChange(status) {
        this.setState({ status });
    }

    handlePackageChange(text) {
        try {
            const packageJson = JSON.parse(text);
            this.state.clause.getTemplate().setPackageJson(packageJson);
            const stringifiedPackage = JSON.stringify(packageJson, null, 2);
            const templateName = packageJson.name;
            const templateVersion = packageJson.version;
            const templateType = packageJson.accordproject.template;
            // Make sure to try re-parsing
            const stateChanges = Utils.parseSample(this.state.clause, this.state.text, { ...this.state.log, meta: 'package.json change successful!' });
            this.setState({
                ...stateChanges,
                package: stringifiedPackage,
                templateName,
                templateVersion,
                templateType,
            });
        } catch (error) {
            console.log(`ERROR ${JSON.stringify(error.message)}`);
            this.setState({
                package: text,
                log: {
                    ...this.state.log,
                    meta: `[Change Template package.json] ${error}`,
                },
            });
        }
    }

    handleNameChange(e, input) {
        try {
            const packageJson = JSON.parse(this.state.package);
            packageJson.name = input.value;
            this.state.clause.getTemplate().setPackageJson(packageJson);
            const stringifiedPackage = JSON.stringify(packageJson, null, 2);
            const logMeta = 'Template Name change successful!';
            const status = 'changed';
            this.setState({
                templateName: input.value,
                package: stringifiedPackage,
                log: {
                    ...this.state.log,
                    meta: logMeta,
                },
                status,
            });
        } catch (error) {
            console.log(`ERROR ${JSON.stringify(error.message)}`);
            this.setState({
                templateName: input.value,
                log: {
                    ...this.state.log,
                    meta: `[Change Template Name] ${error}`,
                },
            });
        }
    }

    handleVersionChange(e, input) {
        try {
            const packageJson = JSON.parse(this.state.package);
            packageJson.version = input.value;
            this.state.clause.getTemplate().setPackageJson(packageJson);
            const stringifiedPackage = JSON.stringify(packageJson, null, 2);
            const logMeta = 'Template version change successful!';
            const status = 'changed';
            this.setState({
                templateVersion: input.value,
                package: stringifiedPackage,
                log: {
                    ...this.state.log,
                    meta: logMeta,
                },
                status,
            });
        } catch (error) {
            console.log(`ERROR ${JSON.stringify(error.message)}`);
            this.setState({
                templateVersion: input.value,
                log: {
                    ...this.state.log,
                    meta: `[Change Template Version] ${error}`,
                },
            });
        }
    }

    handleTypeChange(e, input) {
        try {
            const packageJson = JSON.parse(this.state.package);
            packageJson.accordproject.template = input.value;
            this.state.clause.getTemplate().setPackageJson(packageJson);
            const stringifiedPackage = JSON.stringify(packageJson, null, 2);
            const status = 'changed';
            // Make sure to try re-parsing
            const stateChanges = Utils.parseSample(this.state.clause, this.state.text, { ...this.state.log, meta: 'Template kind change successful!' });
            this.setState({
                ...stateChanges,
                templateType: input.value,
                package: stringifiedPackage,
                status,
            });
        } catch (error) {
            console.log(`ERROR ${JSON.stringify(error.message)}`);
            this.setState({
                templateType: input.value,
                log: {
                    ...this.state.log,
                    meta: `[Change Template Type] ${error}`,
                },
            });
        }
    }

    handleREADMEChange(text) {
        try {
            const readme = text;
            let status = this.state.status;
            const template = this.state.clause.getTemplate();
            if (template.getMetadata().getREADME() !== text) {
                status = 'changed';
                template.setReadme(readme);
            }
            this.setState({
                status,
                readme,
                log: {
                    ...this.state.log,
                    meta: 'README change successful!',
                },
            });
        } catch (error) {
            console.log(`ERROR ${JSON.stringify(error.message)}`);
            this.setState({
                readme: text,
                log: {
                    ...this.state.log,
                    meta: `[Change Template README] ${error}`,
                },
            });
        }
    }

    handleSampleChangeInit(text) {
        const { clause, log } = this.state;
        this.setState({ text });
        let status = this.state.status;
        if (Utils.updateTemplateSample(clause, text)) {
            status = 'changed';
        }
        const stateChanges = Utils.parseSample(clause, text, log);
        this.setState({
            ...stateChanges,
            status,
        });
    }

    handleSampleChange(text) {
        console.log('SAMPLE CHANGE! ' + JSON.stringify(text));
        const { clause, log } = this.state;
        this.setState({ text });
        let status = this.state.status;
        if (Utils.updateTemplateSample(clause, text)) {
            status = 'changed';
        }
        const stateChanges = Utils.parseSample(clause, text, log);
        this.setState({
            ...stateChanges,
            status,
        });
        // XXX Works but loses the cursor location
        //this.handleJSONChange(this.state.data);
    }

    async _handleGrammarChange() {
        const text = this.state.grammar;
        const clause = this.state.clause;
        try {
            const status = 'changed';
            const data = JSON.stringify(clause.getData(), null, 2);
            const logText = 'Grammar change successful!';
            let changes = {};
            if (data !== 'null') {
                clause.getTemplate().getParserManager().buildGrammar(text);
                this.handleLogicGrammarChange(text);
                try {
                    const changes = await Utils.draft(clause, data, { ...this.state.log, text: logText });
                    if (changes.log.text.indexOf('successful') === -1) {
                        //throw new Error('Error generating text from this new grammar');
                    }
                    this.setState({
                        ...changes,
                        data,
                        status,
                    });
                } catch (error) {
                    throw error;
                };
            }
        } catch (error1) {
            try {
                console.log(`Error building grammar ${error1.message}`);
                const status = 'changed';
                const template = clause.getTemplate();
                template.getParserManager().buildGrammar(text);
                const log = { ...this.state.log, text: `[Change Template] ${error1.message}` };
                // Disable for now due to round-tripping issues
                // const changesText = Utils.parseSample(clause, this.state.text, log);
                this.setState({
                    grammar: text,
                    status,
                });
            } catch (error2) {
                this.setState({
                    grammar: text,
                    log: {
                        ...this.state.log,
                        text: `[Change Template] ${error2.message}`,
                    },
                });
            }
        }
    }

    handleRequestChange(text) {
        let status = this.state.status;
        if (Utils.updateRequest(this.state.clause, this.state.request, text)) {
            status = 'changed';
        }
        return this.setState({
            request: text,
            status,
        });
    }

    handleStateChange(text) {
        return this.setState({
            cstate: text,
        });
    }

    _handleModelChange() {
        const { editor, clause, logic, log, grammar, markers, text } = this.state;
        const template = clause.getTemplate();
        try {
            template.getLogicManager().getModelManager().validateModelFiles();
            template.getParserManager().buildGrammar(grammar);
            this.setState(Utils.parseSample(clause, text, log));
            const changesLogic = Utils.compileLogic(editor, markers, logic, clause, log);
            this.setState(changesLogic);
        } catch (error) {
            this.setState({
                log: {
                    ...this.state.log,
                    model: `[Change Model] ${error.message}`,
                },
            });
        }
    }

    async handleJSONChange(data) {
        const { clause, log } = this.state;
        if (data !== null) {
            const textChanges = await Utils.draft(clause, data, log);
            this.setState(textChanges);
        }
    }

    _handleLogicChange() {
        const { clause, editor, markers, logic, log } = this.state;
        const changesLogic = Utils.compileLogic(editor, markers, logic, clause, log);
        this.setState(changesLogic);
    }

    handleLogicGrammarChange(grammar) {
        const { clause, text, log, model, logic, markers } = this.state;
        const logicManager = clause.getTemplate().getLogicManager();
        logicManager.getScriptManager().addTemplateFile(grammar, 'grammar/template.tem');
        const changesLogic = Utils.compileLogic(null, markers, logic, clause, this.state.log);
        this.setState(changesLogic);
    }

    handleErgoMounted(editor, newMarkers) {
        const { markers } = this.state;
        this.setState({ markers: Utils.refreshMarkers(editor, markers, newMarkers) });
    }

    async handleRunLogic() {
        // XXX Should check whether the NL parses & the logic
        // compiles & the state/request are valid JSON first
        const state = this.state;
        const logicManager = this.state.clause.getTemplate().getLogicManager();
        const contract = JSON.parse(state.data);
        const request = JSON.parse(state.request);
        const cstate = JSON.parse(state.cstate);
        try {
            const response = await Utils.runLogic(logicManager, contract, request, cstate);
            state.log.execute = 'Execution successful!';
            state.response = JSON.stringify(response.response, null, 2);
            state.cstate = JSON.stringify(response.state, null, 2);
            state.emit = JSON.stringify(response.emit, null, 2);
            this.setState(state);
        } catch(error) {
            state.response = 'null';
            state.emit = '[]';
            state.log.execute = `[Error Executing Template] ${JSON.stringify(error.message)}`;
            this.setState(state);
        };
    }

    async handleInitLogic() {
        // XXX Should check whether the NL parses & the logic
        // compiles & the state/request are valid JSON first
        const state = this.state;
        console.log('Initializing contract');
        const logicManager = this.state.clause.getTemplate().getLogicManager();
        const contract = JSON.parse(state.data);
        try {
            const response = await Utils.runInit(logicManager, contract);
            state.log.execute = 'Execution successful!';
            state.response = JSON.stringify(response.response, null, 2);
            state.cstate = JSON.stringify(response.state, null, 2);
            state.emit = JSON.stringify(response.emit, null, 2);
            this.setState(state);
        } catch(error) {
            state.response = 'null';
            state.cstate = 'null';
            state.emit = '[]';
            state.log.execute = `[Error Executing Template] ${JSON.stringify(error.message)}`;
            this.setState(state);
        };
    }

    async loadTemplateLibrary() {
        const templateLibrary = new TemplateLibrary();
        const templateIndex = await templateLibrary.getTemplateIndex({ latestVersion: true, ciceroVersion });
        const templates = [];
        for (const t in templateIndex) {
            if (Object.prototype.hasOwnProperty.call(templateIndex, t)) {
                templates.push({ key: t, value: `ap://${t}#hash`, text: t });
            }
        }
        this.setState({ templates });
    }

    async loadTemplateFromUrl(templateURL) {
        const thisTemplateURL = templateURL;
        this.setState({ loading: true });
        console.log(`Loading template:  ${thisTemplateURL}`);
        let template;
        try {
            template = await Template.fromUrl(thisTemplateURL);
        } catch (error) {
            console.log(`LOAD FAILED! ${error.message}`); // Error!
            this.handleLoadingFailed(error.message);
            return false;
        }
        try {
            const newState = {...this.state};
            newState.templateURL = thisTemplateURL;
            newState.clause = new Clause(template);
            newState.templateName = newState.clause.getTemplate().getMetadata().getName();
            newState.templateVersion = newState.clause.getTemplate().getMetadata().getVersion();
            newState.templateType = newState.clause.getTemplate().getMetadata().getTemplateType();
            newState.package = JSON.stringify(template.getMetadata().getPackageJson(), null, 2);
            newState.grammar = template.getParserManager().getTemplatizedGrammar();
            newState.model = template.getModelManager().getModels();
            newState.logic = template.getScriptManager().getLogic();
            newState.text = template.getMetadata().getSamples().default;
            newState.request = JSON.stringify(template.getMetadata().getRequest(), null, 2);
            newState.data = 'null';
            this.setState(newState);
            this.setState(Utils.compileLogic(null, this.state.markers, this.state.logic, this.state.clause, this.state.log));
            this.handleModelChange(null, this.state, this.state.model);
            this.handleSampleChangeInit(this.state.text);
            this._handleLogicChange();
            this.handlePackageChange(this.state.package);
            await this.handleJSONChange(this.state.data);
            await this.handleInitLogic(); // Initializes the contract state
            this.handleLoadingSucceeded();
            return true;
        } catch (reason) {
            console.log(`LOAD FAILED! ${reason.message}`); // Error!
            this.handleLoadingFailed(reason.message);
            return false;
        };
    }

    async loadTemplateFromBuffer(buffer) {
        this.setState({ loading: true });
        console.log('Loading template from Buffer');
        let template;
        try {
            template = await Template.fromArchive(buffer);
        } catch (error) {
            console.log(`LOAD FAILED! ${error.message}`); // Error!
            this.handleLoadingFailed(error.message);
            return false;
        }
        try {
            const newState = {...this.state};
            newState.clause = new Clause(template);
            newState.templateName = newState.clause.getTemplate().getMetadata().getName();
            newState.templateVersion = newState.clause.getTemplate().getMetadata().getVersion();
            newState.templateType = newState.clause.getTemplate().getMetadata().getTemplateType();
            newState.package = JSON.stringify(template.getMetadata().getPackageJson(), null, 2);
            newState.grammar = template.getParserManager().getTemplatizedGrammar();
            newState.model = template.getModelManager().getModels();
            newState.logic = template.getScriptManager().getLogic();
            newState.text = template.getMetadata().getSamples().default;
            newState.request = JSON.stringify(template.getMetadata().getRequest(), null, 2);
            newState.data = 'null';
            this.setState(newState);
            this.setState(Utils.compileLogic(null, this.state.markers, this.state.logic, this.state.clause, this.state.log));
            this.handleModelChange(null, this.state, this.state.model);
            this.handleSampleChangeInit(this.state.text);
            this._handleLogicChange();
            this.handlePackageChange(this.state.package);
            await this.handleJSONChange(this.state.data);
            await this.handleInitLogic(); // Initializes the contract state
            this.handleLoadingSucceeded();
            return true;
        } catch (reason) {
            console.log(`LOAD FAILED! ${reason.message}`); // Error!
            this.handleLoadingFailed(reason.message);
            return false;
        };
    }

    render() {
        return (
            <div>
              <TopMenu
                loadTemplateFromBuffer={this.loadTemplateFromBuffer}
                loadTemplateFromUrl={this.loadTemplateFromUrl}
                status={this.state.status}
                templates={this.state.templates}
              />
              <DimmableContainer
                clause={this.state.clause}
                cstate={this.state.cstate}
                data={this.state.data}
                emit={this.state.emit}
                grammar={this.state.grammar}
                handleErgoMounted={this.handleErgoMounted}
                handleGrammarChange={this.handleGrammarChange}
                handleInitLogic={this.handleInitLogic}
                handleJSONChange={this.handleJSONChange}
                handleLoadingFailedConfirm={this.handleLoadingFailedConfirm}
                handleLogicChange={this.handleLogicChange}
                handleModelChange={this.handleModelChange}
                handleNameChange={this.handleNameChange}
                handleVersionChange={this.handleVersionChange}
                handlePackageChange={this.handlePackageChange}
                handleREADMEChange={this.handleREADMEChange}
                handleRequestChange={this.handleRequestChange}
                handleRunLogic={this.handleRunLogic}
                handleSampleChange={this.handleSampleChange}
                handleStateChange={this.handleStateChange}
                handleStatusChange={this.handleStatusChange}
                handleTypeChange={this.handleTypeChange}
                loading={this.state.loading}
                loadingFailed={this.state.loadingFailed}
                loadTemplateFromUrl={this.loadTemplateFromUrl}
                log={this.state.log}
                logic={this.state.logic}
                model={this.state.model}
                package={this.state.package}
                request={this.state.request}
                response={this.state.response}
                status={this.state.status}
                templateName={this.state.templateName}
                templateVersion={this.state.templateVersion}
                templateURL={this.state.templateURL}
                templateType={this.state.templateType}
                text={this.state.text}
              />
              <BottomMenu
                log={this.state.log}
              />
            </div>
        );
    }
}
export default TemplateStudio;

