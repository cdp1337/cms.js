/*! @chrisdiana/cmsjs v2.0.1~cdp1337-20221105 | MIT (c) 2022 Chris Diana | https://github.com/chrisdiana/cms.js */
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}

var defaults = {
  elementId: null,
  layoutDirectory: null,
  defaultView: null,
  errorLayout: null,
  mode: 'SERVER',
  github: null,
  types: [],
  plugins: [],
  frontMatterSeperator: /^---$/m,
  listAttributes: ['tags'],
  dateParser: /\d{4}-\d{2}(?:-\d{2})?/,
  dateFormat: function dateFormat(date) {
    return [date.getMonth() + 1, date.getDate(), date.getFullYear()].join('/');
  },
  extension: '.md',
  sort: undefined,
  markdownEngine: null,
  debug: false,
  messageClassName: 'cms-messages',
  onload: function onload() {},
  onroute: function onroute() {},
  webpath: '/',
  titleSearchResults: 'Search Results'
};

var messageContainer;
var messages = {
  NO_FILES_ERROR: 'ERROR: No files in directory',
  ELEMENT_ID_ERROR: 'ERROR: No element ID or ID incorrect. Check "elementId" parameter in config.',
  DIRECTORY_ERROR: 'ERROR: Error getting files. Make sure there is a directory for each type in config with files in it.',
  GET_FILE_ERROR: 'ERROR: Error getting the file',
  LAYOUT_LOAD_ERROR: 'ERROR: Error loading layout. Check the layout file to make sure it exists.',
  NOT_READY_WARNING: 'WARNING: Not ready to perform action'
};

/**
 * Creates message container element
 * @function
 * @param {string} classname - Container classname.
 */
function createMessageContainer(classname) {
  messageContainer = document.createElement('div');
  messageContainer.className = classname;
  messageContainer.innerHTML = 'DEBUG';
  messageContainer.style.background = 'yellow';
  messageContainer.style.position = 'absolute';
  messageContainer.style.top = '0px';
  document.body.appendChild(messageContainer);
}

/**
 * Handle messages
 * @function
 * @param {string} message - Message.
 * @returns {string} message
 * @description
 * Used for debugging purposes.
 */
function handleMessage(debug, message) {
  if (debug) messageContainer.innerHTML = message;
  return message;
}

/**
 * AJAX Get utility function.
 * @function
 * @async
 * @param {string} url - URL of the request.
 * @param {function} callback - Callback after request is complete.
 */
function get(url, callback) {
  var req = new XMLHttpRequest();
  req.open('GET', url, true);
  req.onreadystatechange = function () {
    if (req.readyState === 4) {
      if (req.status === 200) {
        // Add support for returning the Last-Modified header for lazy timestamps
        callback(req.response, false, req.getResponseHeader('Last-Modified'));
      } else {
        callback(req, req.statusText, null);
      }
    }
  };
  req.send();
}

/**
 * Extend utility function for extending objects.
 * @function
 * @param {object} target - Target object to extend.
 * @param {object} opts - Options to extend.
 * @param {function} callback - Callback function after completion.
 * @returns {object} Extended target object.
 */
function extend(target, opts, callback) {
  var next;
  if (typeof opts === 'undefined') {
    opts = target;
  }
  for (next in opts) {
    if (Object.prototype.hasOwnProperty.call(opts, next)) {
      target[next] = opts[next];
    }
  }
  if (callback) {
    callback();
  }
  return target;
}

/**
 * Utility function for getting a function name.
 * @function
 * @param {function} func - The function to get the name
 * @returns {string} Name of function.
 */
function getFunctionName(func) {
  var ret = func.toString();
  ret = ret.substr('function '.length);
  ret = ret.substr(0, ret.indexOf('('));
  return ret;
}

/**
 * Checks if the file URL with file extension is a valid file to load.
 * @function
 * @param {string} fileUrl - File URL
 * @returns {boolean} Is valid.
 */
function isValidFile(fileUrl, extension) {
  if (fileUrl) {
    var ext = fileUrl.split('.').pop();
    return ext === extension.replace('.', '') || ext === 'html' ? true : false;
  }
}

/**
 * Get URL parameter by name.
 * @function
 * @param {string} name - Name of parameter.
 * @param {string} url - URL
 * @returns {string} Parameter value
 */
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[[]]/g, '\\$&');
  var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

/**
 * Get Github URL based on configuration.
 * @function
 * @param {string} type - Type of file.
 * @returns {string} GIthub URL
 */
function getGithubUrl(type, gh) {
  var url = [gh.host, 'repos', gh.username, gh.repo, 'contents', type + '?ref=' + gh.branch];
  if (gh.prefix) url.splice(5, 0, gh.prefix);
  return url.join('/');
}

/**
 * Formats date string to datetime
 * @param {string} dateString - Date string to convert.
 * @returns {object} Formatted datetime
 */
function getDatetime(dateStr) {
  var dt = new Date(dateStr);
  return new Date(dt.getTime() - dt.getTimezoneOffset() * -60000);
}

/**
 * @param {string} filepath - Full file path including file name.
 * @returns {string} filename
 */
function getFilenameFromPath(filepath) {
  //return filepath.split('\\').pop().split('/').pop();
  return filepath.split('\\').pop();
}

/**
 * Templating function that renders HTML templates.
 * @function
 * @param {string} text - HTML text to be evaluated.
 * @returns {string} Rendered template with injected data.
 */
function Templater(text) {
  return new Function('data', 'var output=' + JSON.stringify(text).replace(/<%=(.+?)%>/g, '"+($1)+"').replace(/<%(.+?)%>/g, '";$1\noutput+="') + ';return output;');
}

/**
 * Load template from URL.
 * @function
 * @async
 * @param {string} url - URL of template to load.
 * @param {object} data - Data to load into template.
 * @param {function} callback - Callback function
 */
function loadTemplate(url, data, callback) {
  get(url, function (success, error) {
    if (error) callback(success, error);
    callback(Templater(success)(data), error);
  });
}

/**
 * Renders the layout into the main container.
 * @function renderLayout
 * @async
 * @param {string} layout - Filename of layout.
 * @param {object} data - Data passed to template.
 */
function renderLayout(layout, config, data, callback) {
  config.container.innerHTML = '';
  var url = [config.webpath, '/', config.layoutDirectory, '/', layout, '.html'].join('');
  loadTemplate(url, data, function (success, error) {
    if (error) {
      handleMessage(messages['LAYOUT_LOAD_ERROR']);
      callback(null, error);
    } else {
      config.container.innerHTML = success;
      callback('rendered', null);
    }
  });
}

/**
 * Markdown renderer.
 * @thanks renehamburger/slimdown.js
 * @function
 * @returns {string} Rendered markdown content as HTML.
 */
var Markdown = /*#__PURE__*/function () {
  function Markdown() {
    _classCallCheck(this, Markdown);
    this.rules = [
    // headers - fix link anchor tag regex
    {
      regex: /(#+)(.*)/g,
      replacement: function replacement(text, chars, content) {
        var level = chars.length;
        return '<h' + level + '>' + content.trim() + '</h' + level + '>';
      }
    },
    // image
    {
      regex: /!\[([^[]+)\]\(([^)]+)\)/g,
      replacement: '<img src=\'$2\' alt=\'$1\'>'
    },
    // hyperlink
    {
      regex: /\[([^[]+)\]\(([^)]+)\)/g,
      replacement: '<a href=\'$2\'>$1</a>'
    },
    // bold
    {
      regex: /(\*\*|__)(.*?)\1/g,
      replacement: '<strong>$2</strong>'
    },
    // emphasis
    {
      regex: /(\*|_)(.*?)\1/g,
      replacement: '<em>$2</em>'
    },
    // del
    {
      regex: /~~(.*?)~~/g,
      replacement: '<del>$1</del>'
    },
    // quote
    {
      regex: /:"(.*?)":/g,
      replacement: '<q>$1</q>'
    },
    // block code
    {
      regex: /```[a-z]*\n[\s\S]*?\n```/g,
      replacement: function replacement(text) {
        text = text.replace(/```/gm, '');
        return '<pre>' + text.trim() + '</pre>';
      }
    },
    // js code
    {
      regex: /&&&[a-z]*\n[\s\S]*?\n&&&/g,
      replacement: function replacement(text) {
        text = text.replace(/```/gm, '');
        return '<script type="text/javascript">' + text.trim() + '</script>';
      }
    },
    // inline code
    {
      regex: /`(.*?)`/g,
      replacement: '<code>$1</code>'
    },
    // ul lists
    {
      regex: /\n\*(.*)/g,
      replacement: function replacement(text, item) {
        return '\n<ul>\n\t<li>' + item.trim() + '</li>\n</ul>';
      }
    },
    // ol lists
    {
      regex: /\n[0-9]+\.(.*)/g,
      replacement: function replacement(text, item) {
        return '\n<ol>\n\t<li>' + item.trim() + '</li>\n</ol>';
      }
    },
    // blockquotes
    {
      regex: /\n(&gt;|>)(.*)/g,
      replacement: function replacement(text, tmp, item) {
        return '\n<blockquote>' + item.trim() + '</blockquote>';
      }
    },
    // horizontal rule
    {
      regex: /\n-{5,}/g,
      replacement: '\n<hr />'
    },
    // add paragraphs
    {
      regex: /\n([^\n]+)\n/g,
      replacement: function replacement(text, line) {
        var trimmed = line.trim();
        if (/^<\/?(ul|ol|li|h|p|bl)/i.test(trimmed)) {
          return '\n' + line + '\n';
        }
        return '\n<p>' + trimmed + '</p>\n';
      }
    },
    // fix extra ul
    {
      regex: /<\/ul>\s?<ul>/g,
      replacement: ''
    },
    // fix extra ol
    {
      regex: /<\/ol>\s?<ol>/g,
      replacement: ''
    },
    // fix extra blockquote
    {
      regex: /<\/blockquote><blockquote>/g,
      replacement: '\n'
    }];
  }
  _createClass(Markdown, [{
    key: "render",
    value: function render(text) {
      text = '\n' + text + '\n';
      this.rules.forEach(function (rule) {
        text = text.replace(rule.regex, rule.replacement);
      });
      return text.trim();
    }
  }]);
  return Markdown;
}();

/**
 * Represents a file.
 * @constructor
 * @param {string} url - The URL of the file.
 * @param {string} type - The type of file (i.e. posts, pages).
 * @param {object} layout - The layout templates of the file.
 */
var File = /*#__PURE__*/function () {
  function File(url, type, layout, config) {
    _classCallCheck(this, File);
    this.url = url;
    this.type = type;
    this.layout = layout;
    this.config = config;
    this.html = false;
    this.content;
    this.name;
    this.extension;
    this.title;
    this.seotitle;
    this.excerpt;
    this.date;
    this.datetime;
    this.author;
    this.body;
    this.permalink;
    this.tags;
    this.image;
  }

  /**
  * Get file content.
  * @method
  * @async
  * @param {function} callback - Callback function.
  * @description
  * Get the file's HTML content and set the file object html
  * attribute to the file content.
  */
  _createClass(File, [{
    key: "getContent",
    value: function getContent(callback) {
      var _this = this;
      get(this.url, function (success, error, lastModified) {
        if (error) callback(success, error);
        _this.content = success;

        // Patch to retrieve the last modified timestamp automatically from the server.
        // If "datetime" is assigned in the content, it'll override the server header.
        if (lastModified) {
          _this.datetime = lastModified;
        }

        // check if the response returns a string instead
        // of an response object
        if (typeof _this.content === 'string') {
          callback(success, error);
        }
      });
    }

    /**
     * Parse front matter.
     * @method
     * @description
     * Overrides post attributes if front matter is available.
     */
  }, {
    key: "parseFrontMatter",
    value: function parseFrontMatter() {
      var yaml = this.content.split(this.config.frontMatterSeperator)[1];
      if (yaml) {
        var attributes = {};
        yaml.split(/\n/g).forEach(function (attributeStr) {
          // Fix https://github.com/chrisdiana/cms.js/issues/95 by splitting ONLY on the first occurrence of a colon.
          if (attributeStr.indexOf(':') !== -1) {
            var attPos = attributeStr.indexOf(':'),
              attKey = attributeStr.substr(0, attPos).trim(),
              attVal = attributeStr.substr(attPos + 1).trim();
            if (attVal !== '') {
              // Only retrieve this key/value if the value is not an empty string.  (false is allowed)
              attributes[attKey] = attVal;
            }
          }
        });
        extend(this, attributes, null);
      }
    }

    /**
     * Set list attributes.
     * @method
     * @description
     * Sets front matter attributes that are specified as list attributes to
     * an array by splitting the string by commas.
     */
  }, {
    key: "setListAttributes",
    value: function setListAttributes() {
      var _this2 = this;
      this.config.listAttributes.forEach(function (attribute) {
        // Keep ESLint from complaining
        // ref https://ourcodeworld.com/articles/read/1425/how-to-fix-eslint-error-do-not-access-objectprototype-method-hasownproperty-from-target-object-no-prototype-builtins
        if (Object.getOwnPropertyDescriptor(_this2, attribute) && _this2[attribute]) {
          _this2[attribute] = _this2[attribute].split(',').map(function (item) {
            return item.trim();
          });
        }
      });
    }

    /**
     * Sets filename.
     * @method
     */
  }, {
    key: "setFilename",
    value: function setFilename() {
      this.name = this.url.substr(this.url.lastIndexOf('/')).replace('/', '').replace(this.config.extension, '');
    }

    /**
     * Sets permalink.
     * @method
     */
  }, {
    key: "setPermalink",
    value: function setPermalink() {
      this.permalink = this.config.mode === 'GITHUB' ? ['#', this.type, this.name].join('/') : this.url.substring(0, this.url.length - this.config.extension.length) + '.html';
    }

    /**
     * Set file date.
     * @method
     * @description
     * Check if file has date in front matter otherwise use the date
     * in the filename.
     */
  }, {
    key: "setDate",
    value: function setDate() {
      var dateRegEx = new RegExp(this.config.dateParser);
      if (this.date) {
        // Date is set from markdown via the "date" inline header
        this.datetime = getDatetime(this.date);
        this.date = this.config.dateFormat(this.datetime);
      } else if (dateRegEx.test(this.url)) {
        // Date is retrieved from file URL
        this.date = dateRegEx.exec(this.url)[0];
        this.datetime = getDatetime(this.date);
        this.date = this.config.dateFormat(this.datetime);
      } else if (this.datetime) {
        // Lastmodified is retrieved from server response headers or set from the front content
        this.datetime = getDatetime(this.datetime);
        this.date = this.config.dateFormat(this.datetime);
      }
    }

    /**
     * Set file body.
     * @method
     * @description
     * Sets the body of the file based on content after the front matter.
     */
  }, {
    key: "setBody",
    value: function setBody() {
      var html = this.content.split(this.config.frontMatterSeperator).splice(2).join(this.config.frontMatterSeperator);
      if (this.html) {
        this.body = html;
      } else {
        if (this.config.markdownEngine) {
          this.body = this.config.markdownEngine(html);
        } else {
          var md = new Markdown();
          this.body = md.render(html);
        }
      }
    }

    /**
     * Parse file content.
     * @method
     * @description
     * Sets all file attributes and content.
     */
  }, {
    key: "parseContent",
    value: function parseContent() {
      this.setFilename();
      this.setPermalink();
      this.parseFrontMatter();
      this.setListAttributes();
      this.setDate();
      this.setBody();
    }

    /**
     * Check if this file matches a given query
     * 
     * @param {string} query Query to check if this file matches against
     * @returns {boolean}
     */
  }, {
    key: "matchesSearch",
    value: function matchesSearch(query) {
      var _this3 = this;
      var words = query.toLowerCase().split(' '),
        found = true;
      words.forEach(function (word) {
        if (_this3.content.toLowerCase().indexOf(word) === -1 && _this3.title.toLowerCase().indexOf(word) === -1) {
          // This keyword was not located anywhere, matches need to be complete when multiple words are provided.
          found = false;
          return false;
        }
      });
      return found;
    }

    /**
     * Renders file.
     * @method
     * @async
     */
  }, {
    key: "render",
    value: function render(callback) {
      if (this.seotitle) {
        document.title = this.seotitle;
      } else if (this.title) {
        document.title = this.title;
      } else {
        document.title = 'Page';
      }
      return renderLayout(this.layout, this.config, this, callback);
    }
  }]);
  return File;
}();

/**
 * Represents a file collection.
 * @constructor
 * @param {string} type - The type of file collection (i.e. posts, pages).
 * @param {object} layout - The layouts of the file collection type.
 */
var FileCollection = /*#__PURE__*/function () {
  function FileCollection(type, layout, config) {
    _classCallCheck(this, FileCollection);
    this.type = type;
    this.layout = layout;
    this.config = config;
    this.files = [];
    this.directories = [];
    this[type] = this.files;
    this.directoriesScanned = 0;
  }

  /**
   * Generic function to assist with debug logging without needing if ... everywhere.
   * @param  {...any} args mixed arguments to pass
   */
  _createClass(FileCollection, [{
    key: "debuglog",
    value: function debuglog() {
      if (this.config.debug) {
        var _console;
        (_console = console).log.apply(_console, arguments);
      }
    }

    /**
     * Initialize file collection.
     * @method
     * @async
     * @param {function} callback - Callback function
     */
  }, {
    key: "init",
    value: function init(callback) {
      var _this = this;
      this.getFiles(function (success, error) {
        if (error) handleMessage(messages['DIRECTORY_ERROR']);
        _this.loadFiles(function (success, error) {
          if (error) handleMessage(messages['GET_FILE_ERROR']);
          callback();
        });
      });
    }

    /**
     * Get file list URL.
     * @method
     * @param {string} type - Type of file collection.
     * @returns {string} URL of file list
     */
  }, {
    key: "getFileListUrl",
    value: function getFileListUrl(type, config) {
      return config.mode === 'GITHUB' ? getGithubUrl(type, config.github) : this.config.webpath + type;
    }

    /**
     * Get file URL.
     * @method
     * @param {object} file - File object.
     * @returns {string} File URL
     */
  }, {
    key: "getFileUrl",
    value: function getFileUrl(file, mode, type) {
      if (mode === 'GITHUB') {
        return file['download_url'];
      } else {
        var href = getFilenameFromPath(file.getAttribute('href'));
        if (href[0] === '/') {
          // Absolutely resolved paths should be returned unmodified
          return href;
        } else {
          // Relatively linked URLs get appended to the parent directory
          if (type[type.length - 1] === '/') {
            // parent directory ends in a trailing slash
            return type + href;
          } else {
            // No trailing slash, so adjust as necessary
            return type + '/' + href;
          }
        }
      }
    }

    /**
     * Get file elements.
     * @param {object} data - File directory or Github data.
     * @returns {array} File elements
     */
  }, {
    key: "getFileElements",
    value: function getFileElements(data) {
      var fileElements;

      // Github Mode
      if (this.config.mode === 'GITHUB') {
        fileElements = JSON.parse(data);
      }
      // Server Mode
      else {
        // convert the directory listing to a DOM element
        var listElement = document.createElement('div');
        listElement.innerHTML = data;
        // get the links in the directory listing
        fileElements = [].slice.call(listElement.getElementsByTagName('a'));
      }
      return fileElements;
    }

    /**
     * Get files from file listing and set to file collection.
     * @method
     * @async
     * @param {function} callback - Callback function
     */
  }, {
    key: "getFiles",
    value: function getFiles(callback) {
      this.directories = [this.getFileListUrl(this.type, this.config)];
      this.scanDirectory(callback, this.directories[0], true);
    }

    /**
     * Perform the underlying directory lookup
     * @method
     * @async
     * @param {function} callback - Callback function
     * @param {string} directory - Directory URL to scan
     * @param {boolean} recurse - Set to FALSE to prevent further recursion
     */
  }, {
    key: "scanDirectory",
    value: function scanDirectory(callback, directory, recurse) {
      var _this2 = this;
      this.debuglog('Scanning directory', directory);
      get(directory, function (success, error) {
        if (error) callback(success, error);

        // find the file elements that are valid files, exclude others
        _this2.getFileElements(success).forEach(function (file) {
          var fileUrl = _this2.getFileUrl(file, _this2.config.mode, directory);
          if (isValidFile(fileUrl, _this2.config.extension)) {
            // Regular markdown file
            _this2.files.push(new File(fileUrl, _this2.type, _this2.layout.single, _this2.config));
          } else if (recurse && _this2.config.mode !== 'GITHUB' && fileUrl[fileUrl.length - 1] === '/' && fileUrl !== _this2.config.webpath) {
            // in SERVER mode, support recursing ONE directory deep.
            // Allow this for any directory listing NOT absolutely resolved (they will just point back to the parent directory)
            _this2.directories.push(fileUrl);
            _this2.scanDirectory(callback, fileUrl, false);
          }
        });
        _this2.directoriesScanned++;
        if (_this2.directoriesScanned === _this2.directories.length) {
          callback(success, error);
        }
      });
    }

    /**
     * Load files and get file content.
     * @method
     * @async
     * @param {function} callback - Callback function
     */
  }, {
    key: "loadFiles",
    value: function loadFiles(callback) {
      var _this3 = this;
      var promises = [];
      // Load file content
      this.files.forEach(function (file, i) {
        file.getContent(function (success, error) {
          if (error) callback(success, error);
          promises.push(i);
          file.parseContent();
          // Execute after all content is loaded
          if (_this3.files.length == promises.length) {
            callback(success, error);
          }
        });
      });
    }

    /**
     * Search file collection by attribute.
     * @method
     * @param {string} search - Search query.
     */
  }, {
    key: "search",
    value: function search(_search) {
      this[this.type] = this.files.filter(function (file) {
        return file.matchesSearch(_search);
      });
    }

    /**
     * Reset file collection files.
     * @method
     */
  }, {
    key: "resetSearch",
    value: function resetSearch() {
      this[this.type] = this.files;
    }

    /**
     * Get files by tag.
     * @method
     * @param {string} query - Search query.
     * @returns {File[]} Files array
     */
  }, {
    key: "getByTag",
    value: function getByTag(query) {
      this[this.type] = this.files.filter(function (file) {
        if (query && file.tags) {
          return file.tags.some(function (tag) {
            return tag === query;
          });
        }
      });
    }

    /**
     * Get all tags located form this collection
     * 
     * Each set will contain the properties `name` and `count`
     * 
     * @returns {Object[]}
     */
  }, {
    key: "getTags",
    value: function getTags() {
      var tags = [],
        tagNames = [];
      this.files.forEach(function (file) {
        if (file.tags) {
          file.tags.forEach(function (tag) {
            var pos = tagNames.indexOf(tag);
            if (pos === -1) {
              // New tag discovered
              tags.push({
                name: tag,
                count: 1
              });
              tagNames.push(tag);
            } else {
              // Existing tag
              tags[pos].count++;
            }
          });
        }
      });
      return tags;
    }

    /**
     * Get file by permalink.
     * @method
     * @param {string} permalink - Permalink to search.
     * @returns {object} File object.
     */
  }, {
    key: "getFileByPermalink",
    value: function getFileByPermalink(permalink) {
      var _this4 = this;
      this.debuglog('Retrieving file by permalink', permalink);
      var foundFiles = this.files.filter(function (file) {
        return file.permalink === permalink || file.permalink === _this4.config.webpath + permalink;
      });
      if (foundFiles.length === 0) {
        throw 'Requested file could not be located';
      }
      return foundFiles[0];
    }

    /**
     * Renders file collection.
     * @method
     * @async
     * @returns {string} Rendered layout
     */
  }, {
    key: "render",
    value: function render(callback) {
      if (this.layout.title) {
        document.title = this.layout.title;
      } else {
        document.title = 'Listing';
      }
      return renderLayout(this.layout.list, this.config, this, callback);
    }
  }]);
  return FileCollection;
}();

/**
 * Represents a CMS instance
 * @constructor
 * @param {object} options - Configuration options.
 */
var CMS = /*#__PURE__*/function () {
  function CMS(view, options) {
    _classCallCheck(this, CMS);
    this.ready = false;
    /** @property FileCollection[] */
    this.collections = {};
    this.filteredCollections = {};
    this.state;
    this.view = view;
    this.config = Object.assign({}, defaults, options);
  }

  /**
   * Generic function to assist with debug logging without needing if ... everywhere.
   * @param  {...any} args mixed arguments to pass
   */
  _createClass(CMS, [{
    key: "debuglog",
    value: function debuglog() {
      if (this.config.debug) {
        var _console;
        (_console = console).log.apply(_console, arguments);
      }
    }

    /**
     * Init
     * @method
     * @description
     * Initializes the application based on the configuration. Sets up up config object,
     * hash change event listener for router, and loads the content.
     */
  }, {
    key: "init",
    value: function init() {
      var _this = this;
      // create message container element if debug mode is enabled
      if (this.config.debug) {
        createMessageContainer(this.config.messageClassName);
      }
      if (this.config.elementId) {
        // setup container
        this.config.container = document.getElementById(this.config.elementId);
        this.view.addEventListener('click', function (e) {
          if (e.target && e.target.nodeName === 'A') {
            _this.listenerLinkClick(e);
          }
        });
        if (this.config.container) {
          // setup file collections
          this.initFileCollections(function () {
            // check for hash changes
            _this.view.addEventListener('hashchange', _this.route.bind(_this), false);
            // AND check for location.history changes (for SEO reasons)
            _this.view.addEventListener('popstate', function () {
              _this.route();
            });
            // start router by manually triggering hash change
            //this.view.dispatchEvent(new HashChangeEvent('hashchange'));

            // Backwards compatibility with 2.0.1 events
            if (_this.config.onload && typeof _this.config.onload === 'function') {
              document.addEventListener('cms:load', function () {
                _this.config.onload();
              });
            }
            if (_this.config.onroute && typeof _this.config.onroute === 'function') {
              document.addEventListener('cms:route', function () {
                _this.config.onroute();
              });
            }
            _this.route();
            // register plugins and run onload events
            _this.ready = true;
            _this.registerPlugins();
            document.dispatchEvent(new CustomEvent('cms:load', {
              detail: {
                cms: _this
              }
            }));
          });
        } else {
          handleMessage(this.config.debug, messages['ELEMENT_ID_ERROR']);
        }
      } else {
        handleMessage(this.config.debug, messages['ELEMENT_ID_ERROR']);
      }
    }

    /**
     * Handle processing links clicked, will re-route to the history for applicable links.
     * 
     * @param {Event} e Click event from user
     */
  }, {
    key: "listenerLinkClick",
    value: function listenerLinkClick(e) {
      var _this2 = this;
      var targetHref = e.target.href;

      // Scan if this link was a link to one of the articles,
      // we don't want to intercept non-page links.
      this.config.types.forEach(function (type) {
        if (targetHref.indexOf(window.location.origin + _this2.config.webpath + type.name + '/') === 0 && targetHref.substring(targetHref.length - 5) === '.html') {
          // Target link is a page within a registered type path
          _this2.historyPushState(targetHref);
          e.preventDefault();
          return false;
        }
        if (targetHref.indexOf(window.location.origin + _this2.config.webpath + type.name + '.html') === 0) {
          // Target link is a listing page for a registered type path
          _this2.historyPushState(targetHref);
          e.preventDefault();
          return false;
        }
      });
      if (targetHref === window.location.origin + this.config.webpath) {
        // Target link is the homepage, this one can be handled too
        this.historyPushState(targetHref);
        e.preventDefault();
        return false;
      }
    }

    /**
     * Initialize file collections
     * @method
     * @async
     */
  }, {
    key: "initFileCollections",
    value: function initFileCollections(callback) {
      var _this3 = this;
      var promises = [];
      var types = [];

      // setup collections and routes
      this.config.types.forEach(function (type) {
        _this3.collections[type.name] = new FileCollection(type.name, type.layout, _this3.config);
        types.push(type.name);
      });

      // init collections
      types.forEach(function (type, i) {
        _this3.collections[type].init(function () {
          _this3.debuglog('Initialized collection ' + type);
          promises.push(i);
          // reverse order to display newest posts first for post types
          if (type.indexOf('post') === 0) {
            _this3.collections[type][type].reverse();
          }
          // Execute after all content is loaded
          if (types.length == promises.length) {
            callback();
          }
        });
      });
    }

    /**
     * Retrieve the current path URL broken down into individual pieces
     * @returns {array} The segments of the URL broken down by directory
     */
  }, {
    key: "getPathsFromURL",
    value: function getPathsFromURL() {
      var paths = window.location.pathname.substring(this.config.webpath.length).split('/');
      if (paths.length >= 1 && paths[0].substring(paths[0].length - 5) === '.html') {
        // First node (aka type) has HTML extension, just trim that off.
        // This is done because /posts needs to be browseable separately,
        // so we need a way to distinguish between that and the HTML version.
        paths[0] = paths[0].substring(0, paths[0].length - 5);
      }
      return paths;
    }

    /**
     * REPLACE the window location, ONLY really useful on initial pageload
     * 
     * Use historyPushState instead for most interactions where the user may click 'back'
     * @param {string} url URL to replace
     */
  }, {
    key: "historyReplaceState",
    value: function historyReplaceState(url) {
      window.history.replaceState({}, '', url);
      // Immediately trigger route to switch to the new content.
      this.route();
    }
  }, {
    key: "historyPushState",
    value: function historyPushState(url) {
      window.history.pushState({}, '', url);
      // Immediately trigger route to switch to the new content.
      this.route();
    }
  }, {
    key: "route",
    value: function route() {
      var _this4 = this;
      this.debuglog('Initializing routing');
      var paths = this.getPathsFromURL(),
        type = paths[0],
        filename = paths.splice(1).join('/'),
        collection = this.collections[type],
        search = getParameterByName('s') || '',
        tag = getParameterByName('tag') || '',
        mode = '',
        file = null;
      this.debuglog('Paths retrieved from URL:', {
        type: type,
        filename: filename,
        collection: collection
      });
      this.state = window.location.hash.substr(1);
      if (!type) {
        // Default view
        this.historyReplaceState(this.config.webpath + this.config.defaultView + '.html');
        // route will be re-called immediately upon updating the state, so stop here.
        return;
      } else {
        // List and single views
        try {
          if (filename) {
            // Single view
            file = collection.getFileByPermalink([type, filename.trim()].join('/'));
            mode = 'single';
            file.render(function () {
              document.dispatchEvent(new CustomEvent('cms:route', {
                detail: {
                  cms: _this4,
                  type: type,
                  file: file,
                  mode: mode,
                  search: search,
                  tag: tag,
                  collection: collection
                }
              }));
            });
          } else if (collection) {
            // List view
            if (search) {
              // Check for queries
              collection.search(search);
            } else if (tag) {
              // Check for tags
              collection.getByTag(tag);
            } else {
              // Reset search
              collection.resetSearch();
            }
            mode = 'listing';
            collection.render(function () {
              document.dispatchEvent(new CustomEvent('cms:route', {
                detail: {
                  cms: _this4,
                  type: type,
                  file: file,
                  mode: mode,
                  search: search,
                  tag: tag,
                  collection: collection
                }
              }));
            });
          } else {
            throw 'Unknown request';
          }
        } catch (e) {
          mode = 'error';
          console.error(e);
          renderLayout(this.config.errorLayout, this.config, {}, function () {
            document.dispatchEvent(new CustomEvent('cms:route', {
              detail: {
                cms: _this4,
                type: type,
                file: file,
                mode: mode,
                search: search,
                tag: tag,
                collection: collection
              }
            }));
          });
        }
      }
    }

    /**
     * Register plugins.
     * @method
     * @description
     * Set up plugins based on user configuration.
     */
  }, {
    key: "registerPlugins",
    value: function registerPlugins() {
      var _this5 = this;
      this.config.plugins.forEach(function (plugin) {
        var name = getFunctionName(plugin);
        if (!_this5[name]) {
          _this5[name] = plugin;
        }
      });
    }

    /**
      * Sort method for file collections.
      * @method
      * @param {string} type - Type of file collection.
      * @param {function} sort - Sorting function.
      */
  }, {
    key: "sort",
    value: function sort(type, _sort) {
      if (this.ready) {
        this.collections[type][type].sort(_sort);
        this.collections[type].render();
      } else {
        handleMessage(messages['NOT_READY_WARNING']);
      }
    }

    /**
      * Search method for file collections.
      * @method
      * @param {string} type - Type of file collection.
      * @param {string} attribute - File attribute to search.
      * @param {string} search - Search query.
      */
  }, {
    key: "search",
    value: function search(type, _search) {
      this.historyPushState(this.config.webpath + type + '.html?s=' + encodeURIComponent(_search));
    }
  }]);
  return CMS;
}();

/**
 * Automatically manages classes to the body based on the current page being viewed
 */
var PageBodyClass = /*#__PURE__*/_createClass(function PageBodyClass() {
  var _this = this;
  _classCallCheck(this, PageBodyClass);
  // Used to track dynamic classes when browsing between pages
  this.classes = [];
  document.addEventListener('cms:route', function (e) {
    var newClasses = [],
      remClasses = [];
    if (e.detail.type && e.detail.mode) {
      newClasses.push(['page', e.detail.type, e.detail.mode].join('-'));
      if (e.detail.search) {
        newClasses.push(['page', e.detail.type, 'search'].join('-'));
      }
      if (e.detail.tag) {
        newClasses.push(['page', e.detail.type, 'tag'].join('-'));
      }
      if (e.detail.file) {
        // Translate the file URL to a valid class name
        // Omit the web path prefix
        var fileTag = e.detail.file.permalink.substring(e.detail.cms.config.webpath.length);
        // Omit the file extension (.html)
        fileTag = fileTag.substring(0, fileTag.length - 5)
        // Replace slashes with dashes
        .replaceAll('/', '-')
        // Lowercase
        .toLowerCase();
        newClasses.push('page-' + fileTag);
      }
    }

    // Strip classes which are no longer needed on the body.
    // These are handled in bulk to minimize the number of CSS rendering required by the engine
    _this.classes.forEach(function (c) {
      if (newClasses.indexOf(c) === -1) {
        remClasses.push(c);
      }
    });
    if (remClasses.length > 0) {
      var _document$body$classL;
      (_document$body$classL = document.body.classList).remove.apply(_document$body$classL, remClasses);
    }
    if (newClasses.length > 0) {
      var _document$body$classL2;
      (_document$body$classL2 = document.body.classList).add.apply(_document$body$classL2, newClasses);
    }

    // Remember the dynamic classes for the next pageload so they can be removed if necessary
    // otherwise browsing through different pages will simply keep adding more and more class tags.
    _this.classes = newClasses;
  });
});

/**
 * CMS.js v2.0.0
 * Copyright 2018 Chris Diana
 * https://chrisdiana.github.io/cms.js
 * Free to use under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 */

// Load addons
new PageBodyClass();
var main = (function (options) {
  return new CMS(window, options);
});

export { main as default };
