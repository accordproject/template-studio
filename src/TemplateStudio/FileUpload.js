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

// Import React FilePond
import { FilePond } from 'react-filepond';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

// Import FilePond styles
import 'filepond/dist/filepond.min.css';

// Our app
class FileUpload extends Component {
  constructor(props) {
    super(props);
    this.handleUploadConfirm = this.handleUploadConfirm.bind(this);
    this.handleUpload = this.handleUpload.bind(this);
  }

  handleInit() {
    console.log('FilePond instance has initialised', this.pond);
  }

  handleUpload(fieldName, file, metadata, load, error, progress) {
    try {
      progress(true, 1024, 1024);
      this.handleUploadConfirm(file);
    } catch (err) {
      console.log(`Upload Error ${err.message}`);
    }
    return {
      abort: () => {
      },
    };
  }

  handleUploadConfirm(file) {
    this.props.handleUploadConfirm(file);
  }

  render() {
    return (
      <FilePond
        ref={(ref) => {
          this.pond = ref;
        }}
        oninit={() => this.handleInit()}
        server={{ process: this.handleUpload }}
        instantUpload
      >
        {/* Update current files  */}
        {[]}
      </FilePond>
    );
  }
}

FileUpload.propTypes = {
  handleUploadConfirm: PropTypes.func.isRequired,
};

export default FileUpload;
