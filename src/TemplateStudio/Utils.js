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

/* Libraries */

import moment from 'moment'; // For DateTime support during contract execution

/* Ergo */

import Ergo from '@accordproject/ergo-compiler/lib/ergo.js';

function getUrlVars() {
    let vars = {};
    window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = decodeURIComponent(value);
    });
    return vars;
}
function getUrlParam(parameter, defaultvalue){
    let urlparameter = defaultvalue;
    try {
        if(window.location.href.indexOf(parameter) > -1){
            if (getUrlVars()[parameter]) {
                urlparameter = getUrlVars()[parameter];
            } else {
                throw new Error('Cannot parse template URL parameter');
            }
        } else {
            console.log('Did not find template URL parameter when loading studio, using default: ' + urlparameter);
        }
    } catch (error) {
        console.log('Did not find template URL parameter when loading studio, using default: ' + urlparameter);
    }
    return urlparameter;
}
function initUrl(defaultUrl) {
    return getUrlParam('template', defaultUrl);
}
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
        if (compiledLogic.hasOwnProperty('error')) {
            const error = compiledLogic.error;
            state.log.logic = error.verbose;
            if (editor) {
                console.log('ERROR'+JSON.stringify(error));
                state.markers = [];
                state.markersSource = [];
                state.markers.push
                (editor.markText({line:error.locstart.line-1,ch:error.locstart.character},
                                 {line:error.locend.line-1,ch:error.locend.character+1},
                                 {className: 'syntax-error', title: error.verbose}));
                state.markersSource.push
                ({ start: {line:error.locstart.line-1,ch:error.locstart.character},
                   end: {line:error.locend.line-1,ch:error.locend.character+1},
                   kind: {className: 'syntax-error', title: error.verbose}});
            }
        } else {
            const compiledLogicLinked = Ergo.compileToJavaScript(logic,model,'cicero',true);
            state.markers.forEach(marker => marker.clear());
            state.markersSource = [];
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
function updateRequest(clause,oldrequest,request) {
    if (oldrequest !== request) {
        try {
            clause.getTemplate().setRequest(JSON.parse(request));
        } catch (error) {
        }
        return true;
    } else {
        return false;
    }
}
function updateModel(clause,name,oldcontent,newcontent,grammar) {
    const modelManager = clause.getTemplate().getModelManager();
    if (oldcontent !== newcontent) {
        modelManager.validateModelFile(newcontent,name);
        const oldNamespace = new ModelFile(modelManager, oldcontent, name).getNamespace();
        const newNamespace = new ModelFile(modelManager, newcontent, name).getNamespace();
        if (oldNamespace === newNamespace) {
            modelManager.updateModelFile(newcontent,name,true);
        } else {
            modelManager.deleteModelFile(oldNamespace);
            modelManager.addModelFile(newcontent,name,true);
        }
        // XXX Have to re-generate the grammar if the model changes
        clause.getTemplate().buildGrammar(grammar);
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

export {
    initUrl,
    parseSample,
    generateText,
    compileLogic,
    runLogic,
    runInit,
    updateSample,
    updateRequest,
    updateModel,
    updateLogic
};
