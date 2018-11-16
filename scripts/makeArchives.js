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

const Template = require('@accordproject/cicero-core').Template;
const Clause = require('@accordproject/cicero-core').Clause;
const path = require('path');
const semver = require('semver')
const ciceroVersion = require('../package.json').dependencies['@accordproject/cicero-core'];

const {
    promisify
} = require('util');
const {
    resolve
} = require('path');
const fs = require('fs-extra')
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const mkdirp = require('mkdirp');
const writeFile = promisify(fs.writeFile);

/**
 * GLOBALS
 */
const rootDir = resolve(__dirname, '../node_modules/@accordproject/cicero-template-library/src');
const archiveDir = resolve(__dirname, '../static/archives');

/**
 * Generating a static website from a template library
 * 
 * - Scans the 'src' directory for templates
 * - Loads each template using Template.fromDirectory
 * - Generates an archive for the template and saves to the 'state/archives' directory
 * 
 * Options (command line)
 * - template name (only this template gets built)
 */
(async function () {
    try {
        let templateName = process.argv.slice(2);
        if(templateName && templateName.length > 0) {
            console.log('Only building template: ' + templateName);
        } else {
            templateName = null;
        }

        await buildTemplates( templateName );

    }
    catch(err) {
        console.log(err);
    }
})();

/**
 * Get all the files beneath a subdirectory
 * 
 * @param {String} dir - the root directory
 */
async function getFiles(dir) {
    const subdirs = await readdir(dir);
    const files = await Promise.all(subdirs.map(async (subdir) => {
        const res = resolve(dir, subdir);
        return (await stat(res)).isDirectory() ? getFiles(res) : res;
    }));
    return files.reduce((a, f) => a.concat(f), []);
}

/**
 * Builds all the templates and copies the valid templates
 * to the ./build/archives directory
 * @param {String} [selectedTemplate] - optional name of a template. If specified this is the only template that is built
 * @returns {Object} the index of clause and contract templates
 */
async function buildTemplates(selectedTemplate) {
    const files = await getFiles(rootDir);
    for (const file of files) {
        const fileName = path.basename(file);
        let selected = false;

        // assume all package.json files that are not inside node_modules are templates
        if (fileName === 'package.json') {
            const packageJson = fs.readFileSync(file, 'utf8');
            const pkgJson = JSON.parse(packageJson);
            if(pkgJson.name != selectedTemplate) {
                selected = false;
            }
            pkgJson.cicero.version = '^' + ciceroVersion;
            fs.writeFileSync(file, JSON.stringify(pkgJson), 'utf8', function (err) {
                if (err) {
                    return console.log(err);
                }
            });
            selected = true;
        }

        // unless a given template name has been specified
        if(selected && selectedTemplate) {
            const packageJson = fs.readFileSync(file, 'utf8');
            const pkgJson = JSON.parse(packageJson);
            if(pkgJson.name != selectedTemplate) {
                selected = false;
            }
        }

        if(selected) {
            // read the parent directory as a template
            const templatePath = path.dirname(file);
            console.log(`Processing ${templatePath}`);
            const dest = templatePath.replace('/node_modules/@accordproject/cicero-template-library/src/', '/static/');
            await fs.ensureDir(archiveDir);

            try {
                const template = await Template.fromDirectory(templatePath);
                const templateName = template.getMetadata().getName();

                if(!process.env.SKIP_GENERATION && (templateName === 'helloworld' || templateName === 'empty' || templateName === 'empty-contract' )) {
                    const language = template.getMetadata().getLanguage();
                    let archive;
                    // Only produce Ergo archives
                    if (language === 0) {
                        archive = await template.toArchive('ergo');
                        const destPath = path.dirname(dest);
    
                        await fs.ensureDir(destPath);
                        const archiveFileName = `${template.getIdentifier()}.cta`;
                        const archiveFilePath = `${archiveDir}/${archiveFileName}`;
                        await writeFile(archiveFilePath, archive);
                        console.log('Copied: ' + archiveFileName);
                    } else {
                        console.log('Skipping: ' + template.getIdentifier() + ' (in JavaScript)');
                    }
                } else {
                    console.log('Skipping: ' + template.getIdentifier());
                }
            } catch (err) {
                console.log(err);
                console.log(`Failed processing ${file} with ${err}`);
            }
        }
    }

    return;
};

