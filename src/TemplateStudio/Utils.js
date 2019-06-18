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

import moment from 'moment-mini'; // For DateTime support during contract execution

/* Ergo */

import { LogicManager } from '@accordproject/ergo-compiler';
import { EvalEngine } from '@accordproject/ergo-engine/index.browser.js';

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
    console.log('PARSING SAMPLE TEXT: ' + text);
    clause.parse(text);
    changes.data = JSON.stringify(clause.getData(), null, 2);
    console.log('SUCCESS AND DATA IS : ' + changes.data);
    changes.log = textLog(log, 'Parse successful!');
  } catch (error) {
    console.log('FAILURE!' + error.message);
    changes.data = 'null';
    changes.log = textLog(log, `[Parse Contract] ${error.message}`);
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
function updateModel(clause, name, newcontent, grammar) {
    const template = clause.getTemplate();
    const logicManager = template.getLogicManager();
    try {
        logicManager.updateModel(newcontent, name);
        // XXX Have to re-generate the grammar if the model changes
        clause.getTemplate().buildGrammar(grammar);
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

async function generateText(clause, data, log) {
  const changes = {};
  try {
    const dataContent = JSON.parse(data);
    clause.setData(dataContent);
    const options = {
      wrapVariables: false
    };
    const text = await clause.generateText(options);
    console.log('>>> GENERATETEXT text' + JSON.stringify(text));
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

function compileLogic(editor, markers, logic, model, grammar, clause, log) {
  const changes = {};
  let newMarkers = [];
  let newLogic = [];
  if (logic.length === 0) {
    return;
  }

  try {
      const logicManager = new LogicManager('cicero');
      logicManager.getScriptManager().addTemplateFile(grammar, 'grammar/template.tem');
      const modelNames = [];
      const modelContent = [];
      model.forEach((m) => {
          modelNames.push(m.name);
          modelContent.push(m.content);
      });
      logic.forEach((l) => {
          logicManager.addLogicFile(l.content, l.name);
      });
      logicManager.addModelFiles(modelContent, modelNames);
      try {
          logicManager.compileLogicSync(true);
          logic.forEach((m) => {
              const mfix = m;
              mfix.markersSource = [];
              newMarkers = mfix.markersSource;
              newLogic.push(mfix);
          });
          newLogic = logic;
          changes.log = logicLog(log, 'Compilation successful');
      } catch (error) {
          const message = error.message;
          const descriptor = error.fileLocation;
          changes.log = logicLog(log, message);
          logic.forEach((m) => {
              if (message.indexOf(m.name) !== -1) {
                  const mfix = m;
                  mfix.markersSource = [];
                  mfix.markersSource.push(
                      { start: { line: descriptor.start.line - 1, ch: descriptor.start.character },
                        end: { line: descriptor.end.line - 1, ch: descriptor.end.character + 1 },
                        kind: { className: 'syntax-error', title: descriptor.message } },
                  );
                  newMarkers = mfix.markersSource;
                  newLogic.push(mfix);
              } else {
                  newLogic.push(m);
              }
          });
      }
      clause.getTemplate().logicManager = logicManager;
      changes.logicManager = logicManager;
      changes.grammar = grammar;
  } catch (error) {
    newLogic = logic;
    changes.log = logicLog(log, `Compilation error ${error.message}`);
  }
  if (editor) { changes.markers = refreshMarkers(editor, markers, newMarkers) };
  changes.logic = newLogic;
  return changes;
}

async function runLogic(logicManager, contract, request, cstate) {
  const engine = new EvalEngine();
  const result = await engine.execute(logicManager, 'test', contract, request, cstate, moment().format());
  return result;
}

async function runInit(logicManager, contract) {
  const engine = new EvalEngine();
  const response = await engine.init(logicManager, 'test', contract, {}, moment().format());
  return response;
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
