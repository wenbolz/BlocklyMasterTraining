/**
 * Blockly Demos: Code
 *
 * Copyright 2012 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview JavaScript for Blockly's Code demo.
 * @author fraser@google.com (Neil Fraser)
 */
'use strict';

/**
 * Create a namespace for the application.
 */
var Code = {};

/**
 * Blockly's main workspace.
 * @type {Blockly.WorkspaceSvg}
 */
Code.workspace = null;

Code.TABS_ = ['blocks', 'python', 'xml'];

Code.selected = 'blocks';

/**
 * Switch the visible pane when a tab is clicked.
 * @param {string} clickedName Name of tab clicked.
 */
Code.tabClick = function(clickedName) {
	// If the XML tab was open, save and render the content.
	if (document.getElementById('tab_xml').className == 'tabon') {
		var xmlTextarea = document.getElementById('content_xml');
		var xmlText = xmlTextarea.value;
		var xmlDom = null;
		try {
			xmlDom = Blockly.Xml.textToDom(xmlText);
		} catch (e) {
			var q =
				window.confirm(MSG['badXml'].replace('%1', e));
			if (!q) {
				// Leave the user on the XML tab.
				return;
			}
		}
		if (xmlDom) {
			Code.workspace.clear();
			Blockly.Xml.domToWorkspace(xmlDom, Code.workspace);
		}
	}

	if (document.getElementById('tab_blocks').className == 'tabon') {
		Code.workspace.setVisible(false);
	}
	// Deselect all tabs and hide all panes.
	for (var i = 0; i < Code.TABS_.length; i++) {
		var name = Code.TABS_[i];
		document.getElementById('tab_' + name).className = 'taboff';
		document.getElementById('content_' + name).style.visibility = 'hidden';
	}

	// Select the active tab.
	Code.selected = clickedName;
	document.getElementById('tab_' + clickedName).className = 'tabon';
	// Show the selected pane.
	document.getElementById('content_' + clickedName).style.visibility =
		'visible';
	Code.renderContent();
	if (clickedName == 'blocks') {
		Code.workspace.setVisible(true);
	}
	Blockly.svgResize(Code.workspace);
};

/**
 * Populate the currently selected pane with content generated from the blocks.
 */
Code.renderContent = function() {
	var content = document.getElementById('content_' + Code.selected);
	// Initialize the pane.
	if (content.id == 'content_xml') {
		var xmlTextarea = document.getElementById('content_xml');
		var xmlDom = Blockly.Xml.workspaceToDom(Code.workspace);
		var xmlText = Blockly.Xml.domToPrettyText(xmlDom);
		xmlTextarea.value = xmlText;
		xmlTextarea.focus();
	} else if (content.id == 'content_python') {
		var code = Blockly.Python.workspaceToCode(Code.workspace);
		content.textContent = code;
		if (typeof PR.prettyPrintOne == 'function') {
			code = content.textContent;
			code = PR.prettyPrintOne(code, 'py');
			content.innerHTML = code;
		}
	}
};

/**
 * Initialize Blockly.  Called on page load.
 */
Code.init = function() {
	var filename = 'demos.py';
	var container = document.getElementById('content_area');
	var onresize = function(e) {
		var bBox = Code.getBBox_(container);
		for (var i = 0; i < Code.TABS_.length; i++) {
			var el = document.getElementById('content_' + Code.TABS_[i]);
			el.style.top = bBox.y + 'px';
			el.style.left = bBox.x + 'px';
			// Height and width need to be set, read back, then set again to
			// compensate for scrollbars.
			el.style.height = bBox.height + 'px';
			el.style.height = (2 * bBox.height - el.offsetHeight) + 'px';
			el.style.width = bBox.width + 'px';
			el.style.width = (2 * bBox.width - el.offsetWidth) + 'px';
		}
		// Make the 'Blocks' tab line up with the toolbox.
		if (Code.workspace && Code.workspace.toolbox_.width) {
			document.getElementById('tab_blocks').style.minWidth =
				(Code.workspace.toolbox_.width - 38) + 'px';
			// Account for the 19 pixel margin and on each side.
		}
	};

	window.addEventListener('resize', onresize, false);

	for (var messageKey in MSG) {
		if (messageKey.indexOf('cat') == 0) {
			Blockly.Msg[messageKey.toUpperCase()] = MSG[messageKey];
		}
	}

	Code.bindClick = function(el, func) {
		if (typeof el == 'string') {
			el = document.getElementById(el);
		}
		el.addEventListener('click', func, true);
		el.addEventListener('touchend', func, true);
	};

	Code.getBBox_ = function(element) {
		var height = element.offsetHeight;
		var width = element.offsetWidth;
		var x = 0;
		var y = 0;
		do {
			x += element.offsetLeft;
			y += element.offsetTop;
			element = element.offsetParent;
		} while (element);
		return {
			height: height,
			width: width,
			x: x,
			y: y
		};
	};

	Code.pythoncode_save = function() {
		var fileName = prompt('File Name for download Python workspace code:', 'demos.py');
		if (!fileName) { // If cancelled.
			return;
		}
		var code = Blockly.Python.workspaceToCode(Code.workspace);
		var data = new Blob([code], {
			type: 'text/py'
		});
		Code.createAndDownloadFile(filename, data);
	};

	Code.createAndDownloadFile = function(filename, data) {
		var clickEvent = new MouseEvent('click', {
			'view': window,
			'bubbles': true,
			'cancelable': false
		});
		var a = document.createElement('a');
		a.href = window.URL.createObjectURL(data);
		a.download = filename;
		a.textContent = 'Download file!';
		a.dispatchEvent(clickEvent);
	};

	var toolboxText = document.getElementById('toolbox').outerHTML;
	toolboxText = toolboxText.replace(/(^|[^%]){(\w+)}/g,
		function(m, p1, p2) {
			return p1 + MSG[p2];
		});
	var toolboxXml = Blockly.Xml.textToDom(toolboxText);

	Code.workspace = Blockly.inject('content_blocks', {
		grid: {
			spacing: 25,
			length: 3,
			colour: '#ccc',
			snap: true
		},
		media: 'media/',
		toolbox: toolboxXml,
		zoom: {
			controls: true,
			wheel: true
		}
	});

	Code.tabClick(Code.selected);

	for (var i = 0; i < Code.TABS_.length; i++) {
		var name = Code.TABS_[i];
		Code.bindClick('tab_' + name,
			function(name_) {
				return function() {
					Code.tabClick(name_);
				};
			}(name));
	}
	onresize();
	Blockly.svgResize(Code.workspace);
	window.setTimeout(Code.importPrettify, 1);
	document.getElementById("download_button").addEventListener('click', Code.pythoncode_save);
};

// Load the Code demo's language strings.
document.write('<script src="js/category-zh-hans.js"></script>\n');
// Load Blockly's language strings.
document.write('<script src="js/blocks-zh-hans.js"></script>\n');

window.addEventListener('load', Code.init);