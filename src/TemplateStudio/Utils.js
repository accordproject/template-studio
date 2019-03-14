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

/* Libraries */

import moment from 'moment'; // For DateTime support during contract execution

/* Concerto */

import { ModelFile } from 'composer-concerto';

/* Ergo */

import Ergo from '@accordproject/ergo-compiler/lib/ergo.js';

function getUrlVars() {
  const vars = {};
  window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value) => {
    vars[key] = decodeURIComponent(value);
  });
  return vars;
}
function getUrlParam(parameter, defaultvalue) {
  let urlparameter = defaultvalue;
  try {
    if (window.location.href.indexOf(parameter) > -1) {
      if (getUrlVars()[parameter]) {
        urlparameter = getUrlVars()[parameter];
      } else {
        throw new Error('Cannot parse template URL parameter');
      }
    } else {
      console.log(`Did not find template URL parameter when loading studio, using default: ${urlparameter}`);
    }
  } catch (error) {
    console.log(`Did not find template URL parameter when loading studio, using default: ${urlparameter}`);
  }
  return urlparameter;
}
function initUrl(defaultUrl) {
  return getUrlParam('template', defaultUrl);
}
function textLog(log, msg) {
  return {
    text: msg,
    model: log.model,
    logic: log.logic,
    meta: log.meta,
    execute: log.execute,
    loading: log.loading,
  };
}
function logicLog(log, msg) {
  return {
    text: log.text,
    model: log.model,
    logic: msg,
    meta: log.meta,
    execute: log.execute,
    loading: log.loading,
  };
}
function parseSample(clause, text, log) {
  const changes = {};
  try {
    clause.parse(text);
    changes.data = JSON.stringify(clause.getData(), null, 2);
    changes.log = textLog(log, 'Parse successful!');
    changes.text = text;
  } catch (error) {
    changes.data = 'null';
    changes.log = textLog(log, `[Parse Contract] ${error.message}`);
    changes.text = text;
  }
  return changes;
}

function updateSample(clause, sample) {
  const template = clause.getTemplate();
  const samples = template.getMetadata().getSamples();
  if (samples.default !== sample) {
    samples.default = sample;
    template.setSamples(samples);
    return true;
  }
  return false;
}

function generateText(clause, data, log) {
  const changes = {};
  try {
    const dataContent = JSON.parse(data);
    clause.setData(dataContent);
    const text = clause.generateText();
    changes.text = text;
    changes.data = data;
    if (updateSample(clause, text)) {
      changes.status = 'changed';
    }
    changes.log = textLog(log, 'GenerateText successful!');
  } catch (error) {
    changes.data = data;
    changes.log = textLog(log, `[Instantiate Contract] ${error.message}`);
  }
  return changes;
}

function refreshMarkers(editor, oldMarkers, newMarkersSource) {
  const newMarkers = [];
  oldMarkers.forEach(marker => marker.clear());
  newMarkersSource.forEach(marker =>
    newMarkers.push(editor.markText(marker.start, marker.end, marker.kind)),
  );
  return newMarkers;
}

function compileLogic(editor, markers, logic, model, log) {
  const changes = {};
  let newMarkers = [];
  let newLogic = [];
  try {
    const compiledLogic = Ergo.compileToJavaScript(logic, model, 'cicero', false);
    if (compiledLogic.hasOwnProperty('error')) {
      const error = compiledLogic.error;
      changes.log = logicLog(log, error.verbose);
      logic.forEach((m) => {
        if (error.verbose.indexOf(m.name) !== -1) {
          const mfix = m;
          mfix.markersSource = [];
          mfix.markersSource.push(
            { start: { line: error.locstart.line - 1, ch: error.locstart.character },
              end: { line: error.locend.line - 1, ch: error.locend.character + 1 },
              kind: { className: 'syntax-error', title: error.verbose } },
          );
          newMarkers = mfix.markersSource;
          newLogic.push(mfix);
        } else {
          newLogic.push(m);
        }
      });
    } else {
      const compiledLogicLinked = Ergo.compileToJavaScript(logic, model, 'cicero', true);
      changes.clogic = {
        compiled: compiledLogic.success,
        compiledLinked: compiledLogicLinked.success,
      };
      logic.forEach((m) => {
        const mfix = m;
        mfix.markersSource = [];
        newMarkers = mfix.markersSource;
        newLogic.push(mfix);
      });
      newLogic = logic;
      changes.log = logicLog(log, 'Compilation successful');
    }
  } catch (error) {
    newLogic = logic;
    changes.log = logicLog(log, `Compilation error ${error.message}`);
  }
  changes.markers = refreshMarkers(editor, markers, newMarkers);
  changes.logic = newLogic;
  return changes;
}

function runLogic(compiledLogic, contract, request, cstate) {
  const params = { contract, request, state: cstate, emit: [], now: moment() }; // eslint-disable-line no-unused-vars
  const clauseCall = 'dispatch(params);'; // Create the clause call
  const response = eval(compiledLogic + clauseCall); // Call the logic
  return response;
}

function runInit(compiledLogic, contract) {
  const params = { contract, request: null, state: null, emit: [], now: moment() }; // eslint-disable-line no-unused-vars
  const clauseCall = 'init(params);'; // Create the clause call
  const response = eval(compiledLogic + clauseCall); // Call the logic
  return response;
}

function updateRequest(clause, oldrequest, request) {
  if (oldrequest !== request) {
    try {
      clause.getTemplate().setRequest(JSON.parse(request));
    } catch (error) {
      console.log(`Update request error: ${error}`);
    }
    return true;
  }
  return false;
}
function updateModel(clause, name, oldcontent, newcontent, grammar) {
  const modelManager = clause.getTemplate().getModelManager();
  try {
    if (oldcontent !== newcontent) {
      modelManager.validateModelFile(newcontent, name);
      const oldNamespace = new ModelFile(modelManager, oldcontent, name).getNamespace();
      const newNamespace = new ModelFile(modelManager, newcontent, name).getNamespace();
      if (oldNamespace === newNamespace) {
        modelManager.updateModelFile(newcontent, name, true);
      } else {
        modelManager.deleteModelFile(oldNamespace);
        modelManager.addModelFile(newcontent, name, true);
      }
      // XXX Have to re-generate the grammar if the model changes
      clause.getTemplate().buildGrammar(grammar);
    }
    return true;
  } catch (error) {
    return false;
  }
}
function updateLogic(clause, name, content) {
  const scriptManager = clause.getTemplate().getScriptManager();
  if (scriptManager.getScript(name).getContents() !== content) {
    scriptManager.modifyScript(name, '.ergo', content);
    return true;
  }
  return false;
}

export {
  initUrl,
  parseSample,
  generateText,
  refreshMarkers,
  compileLogic,
  runLogic,
  runInit,
  updateSample,
  updateRequest,
  updateModel,
  updateLogic,
};
