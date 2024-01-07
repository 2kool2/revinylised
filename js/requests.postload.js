// https://try.terser.org/
// output: {quote_style: 1},
// Once compressed - Add {} around code to isolate variables

// Only required after initial page load / render

// Requires collectionArr data in /records/data/records.js
import { collectionArr } from '/data/records.min.js';

let requestsData = [];
let refresher = null;

const d = document;
const report = d.getElementById('report');
const details_wrap = d.getElementById('details_wrap');

const supportsDialog = (typeof HTMLDialogElement === 'function');
// const supportsDialog = false;

// Dialog support in CSS
d.documentElement.classList.add('noDialogSupport');
if (supportsDialog) {
  d.documentElement.classList.replace(
    'noDialogSupport',
    'dialogSupported'
  );
}

// Sort the records alphabetically by artist
function sortRecords(records) {
  records.sort((a, b) => {
    const artistA = a.Artist.toLowerCase();
    const artistB = b.Artist.toLowerCase();
    if (artistA < artistB) return -1;
    if (artistA > artistB) return 1;
    return 0;
  });
}
for (const group of collectionArr) {
  sortRecords(group.records);
}

// {

// Not visible, add off main thread
// Different to the global js version as it includes a requestee field
const generateTables = (_) => {
  let checkNo = 0;
  const checkName = 'check';

  function generateElement(config) {
    const cell = d.createElement(config.element);
    const attrs = config.attrs;
    for (const key in attrs) {
      cell.setAttribute(key, attrs[key]);
    }
    if (config.inner) {
      if (typeof config.inner === 'string') {
        cell.textContent = config.inner;
      } else if (typeof config.inner === 'object') {
        cell.appendChild(config.inner);
      }
    }
    return cell;
  }

  function generateRequestedCell() {
    const span = generateElement({
      element: 'span',
      attrs: {
        class: '-visually-hidden'
      },
      inner: 'Requested by'
    });
    const cell = generateElement({
      element: 'th',
      attrs: {
        scope: 'col',
        class: 'requestee'
      },
      inner: span
    });
    return cell;
  }

  function generateTableHead(table, data) {
    const thead = table.createTHead();
    const row = thead.insertRow();
    const span = generateElement({
      element: 'span',
      attrs: {
        class: '-visually-hidden'
      },
      inner: 'Select track'
    });
    const cell = generateElement({
      element: 'th',
      attrs: {
        scope: 'col',
        class: 'checks'
      },
      inner: span
    });
    row.appendChild(cell);
    row.appendChild(generateRequestedCell());
    for (const key of data) {
      const cell = generateElement({
        element: 'th',
        attrs: {
          scope: 'col',
          class: key.toLowerCase()
        },
        inner: key
      });
      row.appendChild(cell);
    }
    return table;
  }

  function generateTableRows(table, records) {
    for (const element of records) {
      let row = table.insertRow();
      const inp = generateElement({
        element: 'input',
        attrs: {
          type: 'checkbox',
          name: checkName + checkNo++
        }
      });
      const cell = generateElement({
        element: 'td',
        attrs: {
          class: 'checks'
        },
        inner: inp
      });
      row.appendChild(cell);

      const cellRequested = generateElement({
        element: 'td',
        attrs: {
          class: 'requestee'
        },
        inner: '' // Fill with requester name later
      });
      row.appendChild(cellRequested);

      let value = '';
      for (const key in element) {
        const cell = generateElement({
          element: 'td',
          attrs: {
            class: key.toLowerCase()
          },
          inner: element[key]
        });
        row.appendChild(cell);
        if (key === 'Artist') value = element[key] + ':';
        if (key === 'Track') value += element[key];
      }

      const checkbox = row.querySelector('input');
      checkbox.value = value;
      checkbox.setAttribute('aria-label', value);
      // checkbox.id = value.replace(/ /g, '-').replace(/:/g, '--');
      checkbox.id = value.replace(/ /g, '_');
    }
    return table;
  }

  function generateTable(styleObj) {
    let table = d.createElement('table');
    const caption = generateElement({
      element: 'caption',
      attrs: {
        class: '-visually-hidden'
      },
      inner: styleObj.title
    });
    table.appendChild(caption);
    table = generateTableRows(table, styleObj.records);
    const data = Object.keys(styleObj.records[0]);
    table = generateTableHead(table, data);
    return table;
  }

  const contentDetails = details_wrap.querySelectorAll('details');

  let count = 0;
  for (const group of collectionArr) {
    const details = contentDetails[count++];
    details.styleObj = group;
  }

  for (const details of contentDetails) {
    const div = d.createElement('div');
    div.className = 'responsive_wrap';
    const styleObj = collectionArr[details.styleObj];
    const table = generateTable(details.styleObj);
    div.appendChild(table);
    div.details = details;
    details.appendChild(div);
  }
};

generateTables();



// Form logic steps:
// 1. Select a track via checkboxes
// 2. Open dialog, list requests, Get user name, add submit button, add remove button
// 3. Submit requests or remove requests
// 4. Send confirmation on submission only

// const formControl = _ => {

const dialog_getUserName = d.getElementById('getUserName');
const dialog_sentRequest = d.getElementById('sentRequest');
const nameInput = d.getElementById('name');

dialog_getUserName.addEventListener('close', (_) => {
    scrollLock(false);
    _removeDialogBackground();
});
dialog_sentRequest.addEventListener('close', (_) => {
  scrollLock(false);
  _removeDialogBackground();
  resetCheckedBoxes();
});

// Initialize name input value from local storage
nameInput.value = localStorage.getItem('name') || '';

const checkedCheckboxes = (_) =>
  d.querySelectorAll('input[type=checkbox]:checked');

const _numberOfCheckedBoxes = (_) => checkedCheckboxes().length;

const _listRequests = (_) => {
  const checkedLists = d.querySelectorAll('.checkedList');

  for (const ol of checkedLists) {
    ol.innerHTML = '';
    const fragment = new DocumentFragment();
    for (const checkbox of checkedCheckboxes()) {
      const li = d.createElement('li');
      li.textContent = checkbox.value.replace(':', ' : ');
      fragment.appendChild(li);
    }
    ol.appendChild(fragment);
  }
};

// Reset all the checked boxes
const resetCheckedBoxes = (_) => {
  for (const checkbox of checkedCheckboxes()) {
    // checkbox.setAttribute('disabled', '');
    checkbox.checked = false;
    // const closestTableRow = checkbox.closest('tr');
    // closestTableRow && closestTableRow.classList.remove('-js-disabled');
  }
};


const bgClass = '-js-dialogBg';

const _removeDialogBackground = (_) => {
  const bg = d.querySelector('.' + bgClass);
  bg && d.body.removeChild(bg);
};

const _appendDialogBackground = (dialog) => {
  const hasBg = d.querySelector('.' + bgClass);
  if (hasBg) return;

  const bg = d.createElement('div');
  bg.addEventListener('click', (e) => _closeModal(dialog));
  bg.classList.add(bgClass);
  d.body.appendChild(bg);
};

const _showModal = (dialog) => {
  _appendDialogBackground(dialog);
  if (supportsDialog) {
    dialog.showModal();
  }
  dialog.removeAttribute('hidden');
  scrollLock(true);
  const firstTabbableElement = dialog.querySelector('[tabindex]');
  firstTabbableElement && firstTabbableElement.focus();
};

const _closeModal = (dialog) => {
  if (supportsDialog) {
    dialog.close();
  }
  dialog.setAttribute('hidden', 'true');
  _removeDialogBackground();
  scrollLock(false);
};

// Get name (dialog)
const getUserName = (_) => {
  const checkedCount = _numberOfCheckedBoxes();
  if (checkedCount < 1) return;

  _listRequests();
  _showModal(dialog_getUserName);
};

const getRequestDataAsObjectFromCheckboxes = (_) => {
  const checkedLists = d.querySelectorAll('.checkedList');
  const output = {
    name: nameInput.value,
    requests: []
  };

  for (const checkbox of checkedCheckboxes()) {
    const [artist, track] = checkbox.value.split(':');
    const record = { artist: artist.trim(), track: track.trim() };
    output.requests.push(record);
  }
  return output;
};

function postRequestData() {
  const data = getRequestDataAsObjectFromCheckboxes();

  fetch('/records/requests/post-requests/', {
    method: 'POST',
    body: JSON.stringify(data)
  })
    .then((response) => response.json())
    .then((response) => {
    //   console.log('postRequestData() success: ', JSON.stringify(response));
      reportConsole('postRequestData() success: \r\n' + JSON.stringify(response))
    })
    .catch((error) => {
        // console.error('postRequestData() error: ', error)
        reportConsole('postRequestData() error: \r\n' + JSON.stringify(response));
    });

    
}

function deleteAllRequestData() {
//   console.log('REMOVING ALL REQUESTS:');
  reportConsole('REMOVING ALL REQUESTS:');

  fetch('/records/requests/delete-all-requests/', {
    method: 'POST'
  })
    .then((response) => reportConsole('deleteAllRequestData() success'))
    .catch((error) => {
        // console.error('deleteAllRequestData()  error: ', error)
        reportConsole('deleteAllRequestData() error: \r\n' + error)
    });
}

// Step 3 - Confirm sent request
const sentRequest = (_) => {
  const dialog = dialog_sentRequest;
  _showModal(dialog);
  const tab = dialog.querySelector('[tabindex]');
  tab && tab.focus();

  let text = `${nameInput.value}'s requests!\n`;
  const message = dialog.querySelector('.message');
  message.textContent = text;
};

const scrollLock = (bool) => {
  bool
    ? d.body.classList.add('-js-scrollLock')
    : d.body.classList.remove('-js-scrollLock');
};

const handleButtonClick = (target) => {
  const dialog = target.closest('.dialog');

  // Close buttons
  const closeBtns = ['.btn-close', '.btn-more', '.btn-finish'];
  if (closeBtns.some((clss) => target.matches(clss))) {
    _closeModal(dialog);
    return;
  }

  // Submit button
  if (target.matches('.btn-submit')) {
    if (nameInput.checkValidity()) {
      _closeModal(dialog);
      sentRequest();
    } else {
      nameInput.focus();
    }
    return;
  }

  // Remove button
  if (target.matches('.btn-remove')) {
    if (nameInput.checkValidity()) {
      _closeModal(dialog);
      removeRequestData();
    } else {
      nameInput.focus();
    }
    return;
  }

  // Delete button
  if (target.matches('.btn-delete')) {
    const result = confirm('Confirm ALL requests are for deletion?');
    result && deleteAllRequestData();
    return;
  }

  // Refresh button
  if (target.matches('.btn-refresh')) {
    // console.log('Refresh pressed');
    fetchRequestData();
    return;
  }
};

const handleTableCellClick = (target) => {
  const checkbox = target.parentElement.querySelector('input[type=checkbox]');
  checkbox && checkbox.click();
};

const handleCheckboxClick = (target) => {
  target.focus();
  getUserName();
};

d.body.addEventListener('click', (event) => {
  const target = event.target;

  // Checkboxes
  if (target.type === 'checkbox') {
    handleCheckboxClick(target);
    return;
  }

  // Table cell
  if (target.matches('td')) {
    handleTableCellClick(target);
    return;
  }

  // Buttons
  if (target.matches('button')) {
    handleButtonClick(target);
  }
});

const form = d.querySelector('form');
form.addEventListener('submit', (event) => {
  event.preventDefault();
  postRequestData();
  resetCheckedBoxes();
//   refreshRequestData(true);
});



// Populate the tables requested fields with requestee name

const clearAllRequestedTableData = (_) => {
  const cells = d.querySelectorAll('td.requestee');
  for (const cell of cells) {
    cell.textContent = '';
    cell.parentElement.classList.remove('requested');
  }
};

const populateTable = (json) => {
  for (const requestee of json) {
    const name = requestee.name;
    for (const request of requestee.requests) {
      const id = (request.artist.trim() + ':' + request.track.trim()).replace(/ /g, '_');
      const checkbox = d.getElementById(id);
      if (!checkbox) {
        reportConsole('populateTable(): name: ' + name, ' Checkbox id not found: ', id);
        continue;
      }
      const checkboxCell = checkbox.closest('td');
      const requestedCell = checkboxCell.nextElementSibling;
      if (requestedCell.textContent !== '') requestedCell.textContent += '\n';
      requestedCell.textContent += name;
      const requestedRow = requestedCell.closest('tr');
      requestedRow.classList.add('requested');
    }
  }
};



// Compare two array for equality

function areRequestDataArraysEqual(arr1, arr2) {
  // Check if both arrays are defined and have the same length
  if (!arr1 || !arr2 || arr1.length !== arr2.length) {
    return false;
  }

  // Compare each element in the array
  for (let i = 0; i < arr1.length; i++) {
    const item1 = arr1[i];
    const item2 = arr2[i];

    // Check if both items are objects
    if (typeof item1 === 'object' && typeof item2 === 'object') {
      // Recursively compare nested arrays/objects
      if (!areRequestDataArraysEqual(item1, item2)) {
        return false;
      }
    } else {
      // Compare non-object values directly
      if (item1 !== item2) {
        return false;
      }
    }
  }

  return true;
}

// Reduce multiple requestees with same name, and remove any duplicate requests

// function reduceAndRemoveDuplicates(requests) {
//   const reducedRequests = {};

//   for (const request of requests) {
//     const name = request.name;
//     const tracks = request.requests;

//     if (!reducedRequests[name]) {
//       reducedRequests[name] = { name: name, requests: new Set() };
//     }

//     // Add each track to the set using a unique identifier
//     tracks.forEach((track) => {
//       const uniqueIdentifier = `${track.artist}:${track.track}`;
//       reducedRequests[name].requests.add(uniqueIdentifier);
//     });
//   }

//   // Convert the object values to an array and convert the set to an array of objects
//   const result = Object.values(reducedRequests).map((item) => {
//     return {
//       name: item.name,
//       requests: Array.from(item.requests, (identifier) => {
//         const [artist, track] = identifier.split(':');
//         return { artist, track };
//       })
//     };
//   });

//   return result;
// }

function reduceAndRemoveEmptyRequestees(requests) {
    const reducedRequests = {};
  
    for (const request of requests) {
      const name = request.name.trim();
      const tracks = request.requests;
  
      if (!reducedRequests[name]) {
        reducedRequests[name] = { name: name, requests: new Set() };
      }
  
      // Add each track to the set using a unique identifier
      tracks.forEach((track) => {
        const uniqueIdentifier = `${track.artist.trim()}~${track.track.trim()}`;
        reducedRequests[name].requests.add(uniqueIdentifier);
      });
    }
  
    // Convert the object values to an array and convert the set to an array of objects
    const result = Object.values(reducedRequests).map((item) => {
      return {
        name: item.name,
        requests: Array.from(item.requests, (identifier) => {
          const [artist, track] = identifier.split('~');
          return { artist, track };
        }),
      };
    });
  
    // Remove requestees with no requests
    const resultWithoutEmptyRequestees = result.filter((item) => item.requests.length > 0);
  
    return resultWithoutEmptyRequestees;
}

// function removeEmptyRequestees(requests) {
//     return requests.filter((item) => item.requests.length > 0);
// }



// Overwrite existing request data

function rewriteRequestData(data) {
    fetch('/records/requests/rewrite-requests/', {
        method: 'POST',
        body: JSON.stringify(data)
    })
        .then((response) => response.json())
        .then((response) =>
            reportConsole('rewriteRequestData() success: \r\n' + JSON.stringify(response))
        )
        .catch((error) => 
            reportConsole('rewriteRequestData() error: ' + error)
        );
}





// Fetch the latest request data and, when updated, process to remove duplicates then overwrite the original file.

// const fetchRequestData = async () => {

//     // refreshRequestData(false);
//     const uniqueNumber = Date.now();
//     report.textContent = `Fetching data ${uniqueNumber}`;
  
//     try {
//         const response = await fetch(`/records/data/requests.json?no-cache=${uniqueNumber}`, {
//             cache: 'no-cache',
//             headers: { 'Content-Type': 'application/json' }
//         });
    
//         if (!response.ok) {
//             throw new Error(`HTTP error! Status: ${response.status}`);
//         }
    
//         const json = await response.json();
//         if (!json) return;
    
//         const reducedJson = reduceAndRemoveDuplicates(json);
//         clearAllRequestedTableData();
//         populateTable(reducedJson);

//         const isEqual = areRequestDataArraysEqual(json, requestsData);
//         if (isEqual) return;

//         rewriteRequestData(reducedJson);
//         requestsData = reducedJson;

//     } catch (error) {
//         console.error('fetchRequestData() error:', error);
//     }
  
//     // refreshRequestData(true);
//   };

// fetchRequestData();



// Old version might play nicer with iPad air v1


const fetchRequestData = (_) => {
    // refreshRequestData(false);
    const uniqueNumber = Date.now();
    report.textContent = 'Fetching data ' + uniqueNumber;
    // redirects: 'manual' required for Safari v12.5.7 to work
    fetch('/records/data/requests.json?no-cache=' + uniqueNumber, {
      cache: 'no-cache',
      headers: { 'Content-Type': 'application/json' },
      redirects: 'manual'
    })
      .then((response) => response.json())
      .then((json) => {

        reportConsole('JSON fetched:' + JSON.stringify(json), false);
        if (!json) return;
        reportConsole('JSON valid')
        const isEqual = areRequestDataArraysEqual(json, requestsData);
        reportConsole('areRequestDataArraysEqual ? ' + isEqual);
        // if (isEqual) return;
        reportConsole(' JSON DON\'T CARE IF EQUAL')
  
        json = reduceAndRemoveEmptyRequestees(json);
        // json = removeEmptyRequestees(json);
        reportConsole(' JSON removed duplicates and empty requestees')
        clearAllRequestedTableData();
        populateTable(json);
        rewriteRequestData(json);
        reportConsole(' JSON file rewritten to server')
        requestsData = json;

      })
      .catch((error) => 
        // console.error('fetchRequestData() error: ', error));
        reportConsole('fetchRequestData() error: ' + error)
      )
  
    // refreshRequestData(true);
  };
  
  fetchRequestData();



// Delete a single request

function removeTrackFromRequests(requests, artistToRemove, trackToRemove) {
  return requests.map((requestee) => ({
    name: requestee.name,
    requests: requestee.requests.filter(
      (request) =>
        request.artist !== artistToRemove || request.track !== trackToRemove
    )
  }));
}

function removeRequestData() {
  // Halt refresh cycle
  // refreshRequestData(false);

  const checkedCheckboxes = d.querySelectorAll(
    'input[type=checkbox]:checked'
  );
  for (const checkbox of checkedCheckboxes) {
    // Get the checked checkbox value
    const [artist, title] = checkbox.value.split(':');

    // Remove from the requests data
    requestsData = removeTrackFromRequests(requestsData, artist.trim(), title.trim());
    checkbox.checked = null;
  }

  // Update requests
  rewriteRequestData(requestsData);
  clearAllRequestedTableData();
  populateTable(requestsData);

  // Restart refresh cycle
//   refreshRequestData(true);
}

// async function removeRequestData() {
//     // Halt refresh cycle
//     refreshRequestData(false);
  
//     const checkedCheckboxes = d.querySelectorAll('input[type=checkbox]:checked');
//     for (const checkbox of checkedCheckboxes) {
//       const [artist, title] = checkbox.value.split(':');
//       requestsData = removeTrackFromRequests(requestsData, artist, title);
//       checkbox.checked = null;
//     }
  
//     // Update requests and refresh cycle
//     await updateAndRefreshRequests();
  
//     // Restart refresh cycle
//     refreshRequestData(true);
// }
  
// async function updateAndRefreshRequests() {
//     // Update requests
//     rewriteRequestData(requestsData);
//     clearAllRequestedTableData();
//     populateTable(requestsData);
  
//     // Refresh cycle
//     await fetchRequestData();
// }
  



const refreshRequestData = (bool) => {
    const refreshRate = 10000;
    // refresher is a global let
    if (bool) {
      clearInterval(refresher);
      refresher = setInterval(fetchRequestData, refreshRate || 10000);
    } else {
      clearInterval(refresher);
    }
};

refreshRequestData(true);



const reportConsole = (text, isCleanedSlate) => {
    // const report = d.getElementById('report');
    if (isCleanedSlate) {
        report.textContent = '';
    }
    report.textContent += '\r\n' + text;
};

reportConsole('supportsDialog: ' + supportsDialog, true);


const screenReport = document.getElementById('screen');
if (screenReport) {
    screenReport.textContent = 'W: ' + window.innerWidth + ', H: ' + window.innerHeight;
}