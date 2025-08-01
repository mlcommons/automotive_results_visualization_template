/* Copyright 2024-25 MLCommons. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/

var scenarioPerfUnits = {};
var scenarioPowerUnits = {};
var accuracyUnits = {};
var validScenarios = {
  "adas":  [ "SingleStream", "ConstantStream" ]
}
var paginationThreshold = 10;
var footerNeedThreshold = 8;
models_adas_ = [ "bevformer", "deeplabv3plus", "ssd" ];

models_datacenter = [];
models_edge = [];

//const dbVersion = 4; defined in config.js
const objStore = "automotive_results";

repo_name = repo_name || "automotive_results_"+results_version;
repo_owner = repo_owner || "mlcommons";
repo_branch = repo_branch || "main";
const dbName = repo_owner + "_" + repo_name + "_" + repo_branch;




async function fetchAndStoreData(db) {
  try {
    const url = "javascripts/summary_results.json";


    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json(); // Convert response to JSON

    console.log("Fetched data:", data); // Debugging: Log fetched data

    // Begin a transaction to save data in IndexedDB
    const transaction = db.transaction([objStore], "readwrite");
    const objectStore = transaction.objectStore(objStore);

    // Store fetched data in IndexedDB
    data.forEach((item, i) => {
      const request = objectStore.put(item); // Use put() to prevent duplicate errors

      request.onsuccess = function() {
	if (i % 1000 === 0) {
	  console.log("Data added/updated in IndexedDB, record:", i + 1);
	}
      };

      request.onerror = function(event) {
	console.error("Error adding record:", event.target.error);
      };
    });

    // Handle transaction completion
    return new Promise((resolve, reject) => {
      transaction.oncomplete = function() {
	console.log("All data successfully added to IndexedDB.");
	resolve();
      };
      transaction.onerror = function(event) {
	console.error("Transaction error:", event.target.error);
	reject(event.target.error);
      };
    });

  } catch (error) {
    console.error("Request Failed:", error);
  }
}

// Read all data from the database
function readAllData() {
  return new Promise((resolve, reject) => {
    // Open the database
    const request = indexedDB.open(dbName, dbVersion);

    request.onsuccess = async function(event) {
      const db = event.target.result;


      // Start a transaction to read data
      const transaction = db.transaction([objStore], "readonly");
      const objectStore = transaction.objectStore(objStore);

      // Open a cursor to iterate through all records
      const data = [];
      const cursorRequest = objectStore.openCursor();

      cursorRequest.onsuccess = function(event) {
	const cursor = event.target.result;
	if (cursor) {
	  data.push(cursor.value); // Push each record to the data array
	  cursor.continue(); // Move to the next record
	} else {
	  initData(data);
	  resolve(data); // Resolve the promise with the data array when done
	}
      };

      cursorRequest.onerror = function(event) {
	reject("Error reading data: " + event.target.errorCode);
      };
    };

    request.onerror = function(event) {
      reject("Error opening IndexedDB: " + event.target.errorCode);
    };

    request.onupgradeneeded = async function(event) {
      const db = event.target.result;
      console.log("Old DB Version: ", event.oldVersion);

      if (event.oldVersion < dbVersion) {
	if (db.objectStoreNames.contains(objStore)) {
	  db.deleteObjectStore(objStore);
	  console.log("Old object store removed");
	}

	const objectStore = db.createObjectStore(objStore, { autoIncrement: true });
	console.log("New object store created");

	// Fetch and store data after creating the object store
	await fetchAndStoreData(db);
      }
    };
  });
}





// for collapsable items
document.addEventListener("DOMContentLoaded", function() {
  const collapsibleButtons = document.querySelectorAll(".collapsible");

  collapsibleButtons.forEach(button => {
    button.addEventListener("click", function() {
      this.classList.toggle("active");
      const content = this.nextElementSibling;

      if (content.style.display === "block") {
	content.style.display = "none";
      } else {
	content.style.display = "block";
      }
    });
  });
});

function getUniqueValues(data, key) {
  let uniqueValues = [];
  $.each(data, function(index, item) {
    if (item[key]  && item[key].trim() != '' && uniqueValues.indexOf(item[key]) === -1) {
      uniqueValues.push(item[key]);
    }
  });
  return uniqueValues;
}

function updateScenarioUnits(data) {
  $.each(data, function(index, item) {
    if (!scenarioPerfUnits.hasOwnProperty(item['Scenario'])) {
      scenarioPerfUnits[item['Model']] = {};
      scenarioPerfUnits[item['Model']][item['Scenario']] = item['Performance_Units'];
    }
    if (item.hasOwnProperty('Power_Units')) {
      if(!scenarioPowerUnits.hasOwnProperty(item['Scenario'])) {
	scenarioPowerUnits[item['Scenario']] = item['Power_Units'];
      }
    }
  });
}


function getUniqueValuesCombined(data, sep, keys) {
  let uniqueValues = [];
  $.each(data, function(index, item) {
    values = []
    for(key in keys) {
      if(!item[keys[key]] || (item[keys[key]]).toString().trim() == '')
	return;
      values.push(item[keys[key]]);
    }
    merged = values.join(sep);
    if (uniqueValues.indexOf(merged) === -1) {
      uniqueValues.push(merged);
    }
  });
  return uniqueValues;
}

function initData(data) {
  models_adas = []
  data.forEach(function(item) {
    //if(item['Category'] != "closed") return;
    if(item['Suite'].includes("adas")) {
      if(!models_adas.includes(item['Model']) && models_adas.includes(item['Model'])) {
        models_adas.push(item['Model']);
      }
    }
  });

  models_adas.sort((a, b) => {
    return models_adas_.indexOf(a) - models_adas_.indexOf(b);
  });
  updateScenarioUnits(data);
}


function filterData(data, keys, values, extra_filter=null) {
  let filtered_data = [];
  if (!data) return filtered_data;

  data.forEach(function(item) {
    let mismatch = false;

    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      let value = values[i];

      if (key == "Suite") {
	if (!item[key].includes(value)) {
	  mismatch = true;
	  break;
	}
      }
      else if (item[key] !== value) {
	mismatch = true;
	break;
      }
      if(extra_filter) {
	if(extra_filter == "accelerator_only"){
	  if (!(item['a#'] > 0)) {
	    mismatch = true;
	    break;
	  }
	}
	else if(extra_filter == "cpu_only"){
	  if (item['a#'] > 0) {
	    mismatch = true;
	    break;
	  }
	}
	else if(extra_filter == "power"){
	  if (!(item.hasOwnProperty('Power_Result'))) {
	    mismatch = true;
	    break;
	  }
	}
      }
    }

    if (!mismatch) {
      filtered_data.push(item);
    }
  });

  return filtered_data;
}

function filterDataFromValues(data, key, values=[]) {
  let filtered_data = [];
  if (!data) return filtered_data;

  data.forEach(function(item) {
    let mismatch = false;
    if (values.includes(item[key])) {
      filtered_data.push(item);
    }
  });
  //initData(filtered_data);
  return filtered_data;
}

function filterDataByAccelerators(data, acc_names, acc_nums) {
  let filtered_data = [];
  if (!data) return filtered_data;

  data.forEach(function(item) {
    let mismatch = false;
    for(i=0; i< acc_names.length; i++) {
      if((item['Accelerator'] == acc_names[i]) && (parseInt(item['a#']) == acc_nums[i]))
	break;
    }
    if (i != acc_names.length) {
      filtered_data.push(item);
    }
  });
  //initData(filtered_data);
  return filtered_data;
}

function filterDataBySystems(data, systems, versions) {
  let filtered_data = [];
  if (!data) return filtered_data;

  data.forEach(function(item) {
    let mismatch = false;
    for(i=0; i< systems.length; i++) {
      if((item['Platform'] == systems[i]) && (item['version'] == versions[i]))
	break;
    }
    if (i != systems.length) {
      filtered_data.push(item);
    }
  });
  //initData(filtered_data);
  return filtered_data;
}

function buildSelectOption(array, selectId, selected=null) {

  $select = $('#'+selectId);
  $select.empty();
  $.each(array, function(index, value) {
    if(selected && value == selected) {
      sel_text = " selected ";
    }
    else {
      sel_text = ""
    }
    let $option = $('<option '+sel_text+'></option>') // Create a new option element
      .val(value.replace(/ /g, '_')) // Optionally set a value attribute
      .text(value); // Set the display text

    $select.append($option); // Append the option to the select element
  });
}

let tableposhtml = `
	    <!-- pager -->
	    <div class="pager">
	    <img src="https://mottie.github.io/tablesorter/addons/pager/icons/first.png" class="first"/>
	    <img src="https://mottie.github.io/tablesorter/addons/pager/icons/prev.png" class="prev"/>
	    <span class="pagedisplay"></span> <!-- this can be any element, including an input -->
	    <img src="https://mottie.github.io/tablesorter/addons/pager/icons/next.png" class="next"/>
	    <img src="https://mottie.github.io/tablesorter/addons/pager/icons/last.png" class="last"/>
	    <select class="pagesize" title="Select page size">
	    <option selected="selected" value="10">10</option>
	    <option value="20">20</option>
	    <option value="30">30</option>
	    <option value="all">All</option>
	    </select>
	    <select class="gotoPage" title="Select page number"></select>
	    </div>
	`;

