// https://try.terser.org/
// output: {quote_style: 1},
// Once compressed - Add {} around code to isolate variables

// Only required after initial page load / render

// Requires collectionArr data in /records/data/records.js
import { collectionArr } from '/records/data/records.min.js';

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


{

    // Not visible, add off main thread
    const generateTables = _ => {

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
        };

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
                    if (key === 'Artist') value = element[key] + ': ';
                    if (key === 'Track') value += element[key];
                }

                const checkbox = row.querySelector('input');
                checkbox.value = value;
                checkbox.setAttribute('aria-label', value);
                checkbox.id = value.replace(/ /g, '-').replace(/:/g, '--');
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

        function getStyleByTitle(title, collectionArr) {
            for (const style of collectionArr) {
                if (style.title.toLowerCase() === title.toLowerCase()) {
                    return style;
                }
            }
            return null; // Return null if title is not found
        }

        function populateDetailsContent(event) {
            const target = event.target;
            if (target.tagName.toLowerCase() !== 'summary') return;
            const details = target.closest('details');
            if (!details || details.querySelector('.responsive_wrap')) return;
            const div = d.createElement('div');
            div.className = 'responsive_wrap';
            // const styleObj = collectionArr[details.title].records;

            const styleObj = getStyleByTitle(details.section_title, collectionArr);
            if (!styleObj) return;

            // const table = generateTable(details.styleObj);
            const table = generateTable(styleObj);
            div.appendChild(table);
            div.details = details;
            details.appendChild(div);
        }

        const contentDetails = details_wrap.querySelectorAll('details');

        // Add data title to the details object
        let count = 0;
        for (const group of collectionArr) {
            const details = contentDetails[count++];
            details.section_title = group.title;
            // details.styleObj = group;
            // console.log('details.styleObj: ', details.styleObj)
        }

        // Add tables on clicking the summary, to reduce excessive DOM children until required.
        details_wrap.addEventListener('click', populateDetailsContent);

    };
    generateTables();



    // Form logic steps:
    // 1. Select tracks via checkboxes
    // 2. Open dialog, list requests, Get user name, add submit button
    // 3. Submit requests
    // 4. Send confirmation

    // const formControl = _ => {

        const dialog_getUserName = d.getElementById('getUserName');
        const dialog_sentRequest = d.getElementById('sentRequest');
        const nameInput = d.getElementById('name');
        const submitButton = dialog_getUserName.querySelector('button.btn-submit');
        const moreButton = dialog_getUserName.querySelector('button.btn-more');

        dialog_getUserName.addEventListener('close', _ => scrollLock(false));
        dialog_sentRequest.addEventListener('close', _ => {
            scrollLock(false);
            // disableCheckedBoxes(); - Shouldn't rely on the listener to do this
        });

        // Initialize name input value from local storage
        nameInput.value = localStorage.getItem('name') || '';

        // Function to toggle submit button visibility based on input validity
        const toggleSubmitButtonVisibility = _ => {
            if (nameInput.checkValidity()) {
                submitButton.removeAttribute('hidden');
            } else {
                submitButton.setAttribute('hidden', '');
            }
        };

        // Initial toggle based on input validity
        toggleSubmitButtonVisibility();

        // Event listener for name input changes
        nameInput.addEventListener('input', toggleSubmitButtonVisibility);

        const checkedCheckboxes = _ => d.querySelectorAll('input[type=checkbox]:checked');

        const numberOfCheckedBoxes = _ => checkedCheckboxes().length;


        const listRequests = _ => {
            const checkedLists = d.querySelectorAll('.checkedList');

            for (const ol of checkedLists) {
                ol.innerHTML = '';
                const fragment = new DocumentFragment();
                for (const checkbox of checkedCheckboxes()) {
                    const li = d.createElement('li');
                    li.textContent = checkbox.value;
                    fragment.appendChild(li);
                }
                ol.appendChild(fragment);
            }
        };



        // Disable and reset all the checked boxes
        const disableCheckedBoxes = _ => {
            for (const checkbox of checkedCheckboxes()) {
                checkbox.setAttribute('disabled', '');
                checkbox.checked = false;
                const closestTableRow = checkbox.closest('tr');
                closestTableRow && closestTableRow.classList.add('-js-disabled');
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


        // Get name (dialog), provide submit button
        const getUserName = _ => {
            const checkedCount = numberOfCheckedBoxes();
            if (checkedCount < 2 || checkedCount > 9) return;

            listRequests();

            const dialog = dialog_getUserName;

             _showModal(dialog);
            // const firstTabbableElement = dialog.querySelector('[tabindex]');
            // firstTabbableElement && firstTabbableElement.focus();

            if (checkedCount >= 5) {
                moreButton.setAttribute('hidden', '');
            } else {
                moreButton.removeAttribute('hidden');
            }
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
                .then((response) =>
                    reportConsole('postRequestData() success: \r\n' + JSON.stringify(response)))
                .catch((error) =>
                    reportConsole(' postRequestData() error:' + error));
        }


        // Step 3 - Confirm sent request
        const sentRequest = _ => {

            const dialog = dialog_sentRequest;

            _showModal(dialog);
            const tab = dialog.querySelector('[tabindex]');
            tab && tab.focus();

            let text = `${nameInput.value}'s requests!\n`;
            const message = dialog.querySelector('.message');
            message.textContent = text;

        };


        const scrollLock = bool => {
            bool
                ?
                d.body.classList.add('-js-scrollLock') :
                d.body.classList.remove('-js-scrollLock');
        };


        const handleButtonClick = target => {
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
        };

        const handleTableCellClick = target => {
            const checkbox = target.parentElement.querySelector('input[type=checkbox]');
            reportConsole('checkbox id:' + checkbox.id);
            checkbox && checkbox.click();
        };

        const handleCheckboxClick = target => {
            target.focus();
            getUserName();
        };

        d.body.addEventListener('click', event => {
            reportConsole('event handler');
            const target = event.target;

            // Checkboxes
            if (target.type === 'checkbox') {
                handleCheckboxClick(target);
                return;
            }

            // Table cell
            if (target.matches('td')) {
                reportConsole('target.matches(td)');
                handleTableCellClick(target);
                return;
            }

            // Buttons
            if (target.matches('button')) {
                handleButtonClick(target);
            }
        });


        const form = d.querySelector('form');
        form.addEventListener('submit', event => {
            event.preventDefault();
            postRequestData();
            disableCheckedBoxes();
        });

    };

    // Minimise work on main thread, and measure
//     setTimeout(_ => {
//         formControl();
//     }, 0);


// }

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