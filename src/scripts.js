/*
Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

const recipesEl = document.getElementById("recipes");
const searchEl = document.getElementById("search");
const searchInputEl = document.getElementById("search_input");
const searchingIndicatorEl = document.getElementById("searching_indicator");
const searchResultsEl = document.getElementById("search_results");

// get lunr search index
fetch(`${window.rootPath}searchIndex.json`)
    .then(res => res.json())
    .then(index => {
        const idx = window.lunr.Index.load(index);
        searchInputEl.oninput = debounce(e => doSearch(idx, e.target.value), 100);
        document.onkeyup = ({ keyCode }) => {
            if (keyCode === 191) searchInputEl.focus();
        };
    });

// takes the built lunr index and the term as a string
// displays search ui and searches for results
function doSearch(idx, term) {
    term = term.trim();
    if (!term.length) {
    // reset and hide search
        show(recipesEl);
        hide(searchEl);
        show(searchingIndicatorEl);
        searchResultsEl.innerHTML = "";
        return;
    }

    // show search
    hide(recipesEl);
    show(searchEl);

    if (term.length < 3) return;

    const results = idx.search(term);
    const matches = results.map(({ ref }) => {
        return { path: ref, title: window.recipes[ref] };
    });

    if (!results.length) return;

    hide(searchingIndicatorEl);

    // clear old results and add new ones
    searchResultsEl.innerHTML = matches
        .map(match => resultTemplate(match))
        .join("\n");
}

function resultTemplate({ path, title }) {
    return `<h4 class="flex items-center p-2 hover:bg-gray-100 rounded">
              <i class="fas fa-robot text-steelblue mr-3"></i>
              <a class="hover:text-shadow-lg hover:no-underline font-display text-3xl font-bold text-steelblue text-shadow no-underline" href="./${path.slice(0, -10)}">${title}</a>
            </h4>`;
}

function hide(el) {
    el.classList.add("hidden");
}
function show(el) {
    el.classList.remove("hidden");
}

// borrowed from underscore.js
function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this,
            args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}
