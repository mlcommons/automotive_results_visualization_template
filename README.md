# MLPerf Inference Visualization Template

If you have a [run](https://raw.githubusercontent.com/GATEOverflow/inference_results_v4.1/main/run.sh) script, just run that in the root of your MLPerf inference_results repository.

```
INFERENCE_RESULTS_REPO_OWNER=${{ github.repository_owner }} bash run.sh
```

This will copy the template code including CSS/HTML overrides and the JS files from this template repository to the docs site of the inference results repository.

Here’s a more refined version of your documentation. It improves the structure and clarity, making it easier for someone to follow, understand, and maintain the project.

---

## Project Overview

This repository handles the results and comparison pages for machine learning inference benchmarks, dynamically generating content for both the main results and comparison pages. 

### Main Files

#### JavaScript Files

- **`common.js`**: Contains common JavaScript functions shared across the application.
  
- **`results_tablesorter.js`**: Manages the table sorting and population for the **Results** page, utilizing the **Tablesorter** plugin for sorting tables dynamically.
  
- **`compare_results.js`**: Contains the JavaScript logic for the **Compare** page, handling the specific functionality for the comparison of different inference results.
  
- **`topresults.js`**: Provides the JavaScript functionality for the **Top Results** page, dealing with the display and logic for top-performing models or results.
  
- **`chart_compare.js`**: Manages the rendering of charts specifically for the **Compare** page.
  
- **`chart_results.js`**: Handles chart generation and display for the **Results** page.
  
- **`chart_topresults.js`**: Responsible for rendering charts for the **Top Results** page.

- **`init_tablesorter.js`**: Initializes and configures the **Tablesorter** plugin for sorting tables on relevant pages.

#### Python Files

- **`process.py`**: Processes the `summary_results.json` file from the inference results repository and generates the **index.md** file for the **Compare** page.
  
- **`process_results.py`**: Takes the `summary_results.json` from the inference results repository and generates the **index.md** file for the **Results** page.

#### Page Generation Notes

- The **Compare** page is dynamically created using JavaScript. No Python code is involved in generating its HTML content.

#### Third Party Libraries Needed
- The code needs [TableSorter plugin](https://github.com/Mottie/tablesorter) for HTML table sorting and [CanvasJS](https://canvasjs.com/) for the chart rendering. 

---

### Repository Workflow

1. **GitHub Actions Integration**:  
   This repository is designed to be cloned via GitHub Actions in the **inference_results** repositories. The cloning process is handled by a **GitHub Actions** workflow, as outlined in the [publish.yml](https://github.com/mlcommons/mlperf_inference_submissions/blob/main/.github/workflows/publish.yml) file.

2. **Dynamic Content Generation**:  
   - The **Compare** pages is rendered entirely via JavaScript.
   - **Results** and **Top Results** pages are generated dynamically through Python scripts `process.py` and `process_results.py` respectively, which process JSON data of the inference submissions and create the necessary markdown files for display.



## Copyright 2024-25 MLCommons. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
