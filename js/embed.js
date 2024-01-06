

// https://try.terser.org/
// output: {quote_style: 1},

// Does not require encapsulation, but postload.js does.
// The constants postloadCSS and postloadJS must be declared in the page HTML

// JS required immediately - Embed 

// console.clear();



// Must match collectionArr[] order, may be different to html
const styleNamesArr = [
  {title: 'R&B & Soul'},
  {title: 'Reggae & Ska'},
  {title: '60\'s Pop Rock'},
  {title: 'Glam Rock'},
  {title: '70\'s Rock'},
  {title: 'Disco'},
  {title: 'Late 70\'s'},
];




// Required for immediate render
const generateDetails = (_ => {

    function styleDetails(style, details) {

      // Use existing, or build new, elements - Must be robust!
        const container = details || document.createElement('details');
        const summary = details ? details.querySelector('summary') : document.createElement('summary');
        const div = summary.querySelector('div') || document.createElement('div');

        if (div.textContent !== style.title) {
          div.textContent = style.title;
          summary.appendChild(div);
          container.appendChild(summary);
        }
        return container;
    }

    const details_wrap = document.getElementById('details_wrap');
    if (!details_wrap) return;
    const domDetails = details_wrap.querySelectorAll('details');
    const fragment = new DocumentFragment();
    let count = 0;
    for (const group of styleNamesArr) {
        const details = styleDetails(group, domDetails[count++]);
        details.styleObj = group;
        fragment.appendChild(details);
    }
    details_wrap.innerHTML = '<div></div>';
    details_wrap.replaceChild(fragment, details_wrap.firstElementChild);
})();

{
  // <link href="styles.postload.min.css" rel=stylesheet media=none onload="this.media='all'">
  const link = document.createElement('link');
  link.href = postloadCSS;
  link.rel = 'stylesheet';
  link.media = 'none';
  link.addEventListener('load', _ => link.media='all');
  document.head.appendChild(link);
}
{
  // Post the actual load event, get the rest of the JS
  const script = document.createElement('script');
  script.src = postloadJS;
  script.type = "module";
  script.setAttribute('defer', true);
  document.body.appendChild(script);
}