"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var core = require('@citation-js/core');

require('@citation-js/plugin-bibjson');

require('@citation-js/plugin-bibtex');

require('@citation-js/plugin-csl');

require('@citation-js/plugin-doi');

require('@citation-js/plugin-ris');

var citeproc = require('citeproc');

var name = require('@citation-js/name');

var date = require('@citation-js/date');

function clone(obj) {
  var copy = {};

  for (var key in obj) {
    copy[key] = _typeof(obj[key]) === 'object' ? clone(obj[key]) : obj[key];
  }

  return copy;
}

var attr = {
  getAttributedEntry: function getAttributedEntry(string, name, value) {
    return string.replace(/^\s*<[a-z]+/i, "$& data-".concat(name, "=\"").concat(value, "\""));
  },
  getPrefixedEntry: function getPrefixedEntry(value, id) {
    return attr.getAttributedEntry(value, 'csl-entry-id', id);
  },
  getWrappedEntry: function getWrappedEntry(value, source, affixes) {
    var getAffix = function getAffix(source, affix) {
      return typeof affix === 'function' ? affix(source) : affix == null ? affix : '';
    };

    if (affixes.prepend == null && affixes.append == null) {
      return value;
    }

    var prefix = getAffix(source, affixes.prepend);
    var suffix = getAffix(source, affixes.append);
    var start = '';
    var end = '';
    var match = value.match(/^([^>]+>)([\s\S]+)(<[^<]+)$/i);

    if (match) {
      start = match[1];
      value = match[2];
      end = match[3];
    }

    return start + prefix + value + suffix + end;
  }
};

function Cite(data, opts) {
  if (!(this instanceof Cite)) {
    return new Cite(data, opts);
  }

  var self = new core.Cite(data, opts);
  this._options = self._options;
  this.log = self.log;
  this.data = self.data;
}

Cite.prototype = Object.create(core.Cite.prototype);
Cite.async = core.Cite.async;
Cite.validateOptions = core.Cite.validateOptions;
Cite.validateOutputOptions = core.Cite.validateOutputOptions;
Cite.input = core.plugins.input.chain;
Cite.inputAsync = core.plugins.input.chainAsync;
Cite.util = Object.assign({
  attr: attr
}, core.util);
Cite.version = {
  cite: core.version,
  citeproc: citeproc.PROCESSOR_VERSION
};
var CSL = core.plugins.config.get('@csl');
Cite.CSL = {
  engine: require('@citation-js/plugin-csl/lib/engines').fetchEngine,
  item: function item(data) {
    return function (id) {
      return data.find(function (entry) {
        return entry.id === id;
      });
    };
  },
  locale: function locale(lang) {
    return CSL.styles.get(CSL.styles.has(lang) ? lang : 'en-US');
  },
  style: function style(_style) {
    return CSL.templates.get(CSL.templates.has(_style) ? _style : 'apa');
  },
  register: {
    addTemplate: CSL.templates.add.bind(CSL.templates),
    getTemplate: CSL.templates.get.bind(CSL.templates),
    hasTemplate: CSL.templates.has.bind(CSL.templates),
    addLocale: CSL.locales.add.bind(CSL.locales),
    getLocale: CSL.locales.get.bind(CSL.locales),
    hasLocale: CSL.locales.has.bind(CSL.locales)
  }
};
Cite.plugins = clone(core.plugins);
delete Cite.plugins.input.util.clean;
Cite.parse = Object.assign({
  input: {
    chain: core.plugins.input.chain,
    chainAsync: core.plugins.input.chainAsync,
    chainLink: core.plugins.input.chainLink,
    chainLinkAsync: core.plugins.input.chainLinkAsync,
    data: core.plugins.input.data,
    dataAsync: core.plugins.input.dataAsync,
    type: core.plugins.input.type,
    async: {
      chain: core.plugins.input.chainAsync,
      chainLink: core.plugins.input.chainLinkAsync,
      data: core.plugins.input.dataAsync
    }
  },
  name: name.parse,
  date: date.parse,
  csl: core.plugins.input.util.clean,
  bibjson: require('@citation-js/plugin-bibjson').parsers.json.record,
  bibtex: function (bibtex) {
    return {
      json: bibtex.parsers.json.parse,
      prop: bibtex.parsers.prop.parse,
      text: bibtex.parsers.text.parse,
      type: bibtex.parsers.type.parse
    };
  }(require('@citation-js/plugin-bibtex/lib/input')),
  bibtxt: function (bibtxt) {
    return {
      text: bibtxt.parse,
      textEntry: bibtxt.textEntry
    };
  }(require('@citation-js/plugin-bibtex/lib/input/bibtxt')),
  doi: function (doi) {
    return {
      api: doi.parsers.api.parse,
      id: doi.parsers.id.parse,
      async: {
        api: doi.parsers.api.parseAsync
      }
    };
  }(require('@citation-js/plugin-doi')),
  json: require('@citation-js/core/lib/plugin-common/input').parsers.json.parse
}, Cite.plugins.input);
Cite.get = Object.assign({
  dict: Cite.plugins.dict,
  name: name.format,
  date: date.format,
  bibtex: {
    json: require('@citation-js/plugin-bibtex/lib/output/json')["default"],
    label: require('@citation-js/plugin-bibtex/lib/output/label')["default"],
    text: require('@citation-js/plugin-bibtex/lib/output/text')["default"],
    type: require('@citation-js/plugin-bibtex/lib/output/type')["default"]
  },
  bibtxt: require('@citation-js/plugin-bibtex/lib/output/bibtxt')["default"],
  json: require('@citation-js/core/lib/plugin-common/output')["default"].data,
  label: require('@citation-js/core/lib/plugin-common/output')["default"].label
}, Cite.plugins.output);
module.exports = Cite;
