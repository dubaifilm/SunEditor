/*
 * wysiwyg web editor
 *
 * suneditor.js
 * Copyright 2017 JiHong Lee.
 * MIT license.
 */
if(typeof window.SUNEDITOR === 'undefined') {window.SUNEDITOR = {}; SUNEDITOR.plugin = {};}

/** default language english */
SUNEDITOR.defaultLang = {
    toolbar : {
        fontFamily : 'Font',
        fontFamilyDelete : 'Remove Font Family',
        formats : 'Formats',
        fontSize : 'Size',
        bold : 'Bold',
        underline : 'Underline',
        italic : 'Italic',
        strike : 'Strike',
        fontColor : 'Font Color',
        hiliteColor : 'Background Color',
        indent : 'Indent',
        outdent : 'Outdent',
        align : 'Align',
        alignLeft : 'Align left',
        alignRight : 'Align right',
        alignCenter : 'Align center',
        justifyFull : 'Justify full',
        left : 'Left',
        right : 'Right',
        center : 'Center',
        bothSide : 'Justify full',
        list : 'list',
        orderList : 'Ordered list',
        unorderList : 'Unordered list',
        line : 'Line',
        table : 'Table',
        link : 'Link',
        image : 'Picture',
        video : 'Video',
        fullScreen : 'Full Screen',
        htmlEditor : 'Code View',
        undo : 'Undo',
        redo : 'Redo'
    },
    dialogBox : {
        linkBox : {
            title : 'Insert Link',
            url : 'URL to link',
            text : 'Text to display',
            newWindowCheck : 'Open in new window'
        },
        imageBox : {
            title : 'Insert Image',
            file : 'Select from files',
            url : 'Image URL',
            resize100 : 'resize 100%',
            resize75 : 'resize 75%',
            resize50 : 'resize 50%',
            resize25 : 'resize 25%',
            remove : 'remove image'
        },
        videoBox : {
            title : 'Insert Video',
            url : 'Media embed URL, YouTube',
            width : 'Width',
            height : 'Height'
        },
        submitButton : 'Submit'
    },
    editLink : {
        edit : 'Edit',
        remove : 'Remove'
    }
};

(function(SUNEDITOR){
    'use strict';

    /**
     * utile func
     */
    var func = SUNEDITOR.func = {
        returnTrue : function() {
            return true;
        },

        getXMLHttpRequest : function() {
            /** 익스플로러 */
            if(window.ActiveXObject){
                try{
                    return new ActiveXObject("Msxml2.XMLHTTP");
                }catch(e){
                    try{
                        return new ActiveXObject("Microsoft.XMLHTTP");
                    }catch(e1){
                        return null;
                    }
                }
            }
            /** 네스케이프 */
            else if(window.XMLHttpRequest){
                return new XMLHttpRequest();
            }
            /** 브라우저 식별 실패 */
            else {
                return null;
            }
        },

        getBasePath : (function() {
            var path = SUNEDITOR.SUNEDITOR_BASEPATH || "";
            if(!path) {
                for(var c = document.getElementsByTagName("script"), i = 0; i < c.length; i++) {
                    var editorTag = c[i].src.match(/(^|.*[\\\/])suneditor\.js(?:\?.*|;.*)?$/i);
                    if(editorTag) {
                        path = editorTag[1];
                        break
                    }
                }
            }
            - 1 === path.indexOf(":/") && "//" !== path.slice(0, 2) && (path = 0 === path.indexOf("/") ? location.href.match(/^.*?:\/\/[^\/]*/)[0] + path : location.href.match(/^[^\?]*\/(?:)/)[0] + path);

            if (!path) throw '[SUNEDITOR.func.getBasePath.fail] The SUNEDITOR installation path could not be automatically detected. Please set the global variable "SUNEDITOR_BASEPATH" before creating editor instances.';

            return path;
        })()
    };

    /**
     * document func
     */
    var dom = SUNEDITOR.dom = {
        getArrayIndex : function(array, element) {
            var idx = -1;
            var len = array.length;

            for(var i=0; i<len; i++) {
                if(array[i] === element) {
                    idx = i;
                    break;
                }
            }

            return idx;
        },

        nextIdx : function(array, item) {
            var idx = this.getArrayIndex(array, item);
            if (idx === -1) return -1;

            return idx + 1;
        },

        prevIdx : function(array, item) {
            var idx = this.getArrayIndex(array, item);
            if (idx === -1) return -1;

            return idx - 1;
        },

        isCell : function(node) {
            return node && /^TD$|^TH$/i.test(node.nodeName);
        },

        getListChildren : function(element, validation) {
            var children = [];
            validation = validation || func.returnTrue;

            (function recursionFunc(current) {
                if (element !== current && validation(current)) {
                    children.push(current);
                }

                var childLen = current.children.length;
                for(var i=0, len=childLen; i<len; i++) {
                    recursionFunc(current.children[i]);
                }
            })(element);

            return children;
        },

        getListChildNodes : function(element, validation) {
            var children = [];
            validation = validation || func.returnTrue;

            (function recursionFunc(current) {
                if (validation(current)) {
                    children.push(current);
                }

                var childLen = current.childNodes.length;
                for(var i=0, len=childLen; i<len; i++) {
                    recursionFunc(current.childNodes[i]);
                }
            })(element);

            return children;
        },

        getParentNode : function(element, tagName) {
            var check = new RegExp("^"+tagName+"$", "i");

            while(!check.test(element.tagName)) {
                element = element.parentNode;
            }

            return element;
        },

        changeTxt : function(element, txt) {
            element.textContent = txt;
        },

        changeClass : function(element, className) {
            element.className = className;
        },

        addClass : function(element, className) {
            if(!element) return;

            var check = new RegExp("(\\s|^)" + className + "(\\s|$)");
            if(check.test(element.className)) return;

            element.className += " " + className;
        },

        removeClass : function(element, className) {
            if(!element) return;

            var check = new RegExp("(\\s|^)" + className + "(\\s|$)");
            element.className = element.className.replace(check, " ").trim();
        },

        toggleClass : function(element, className) {
            var check = new RegExp("(\\s|^)" + className + "(\\s|$)");

            if (check.test(element.className)) {
                element.className = element.className.replace(check, " ").trim();
            }
            else {
                element.className += " " + className;
            }
        },

        removeItem : function(item) {
            try {
                item.remove();
            } catch(e) {
                item.removeNode();
            }
        },

        copyObj : function(obj) {
            var copy = {};
            for (var attr in obj) {
                copy[attr] = obj[attr];
            }
            return copy;
        }
    };

    /**
     * SunEditor core closure
     * @param context
     * @param dom
     * @param func
     * @returns {{save: save, getContent: getContent, setContent: setContent, appendContent: appendContent, disabled: disabled, enabled: enabled, show: show, hide: hide, destroy: destroy}}
     */
    var core = function(context, dom, func){

        /** commandMap, fontList */
        var list = (function(context){
            var commandMap = {
                'FONT': context.tool.fontFamily,
                'B' : context.tool.bold,
                'U' : context.tool.underline,
                'I' : context.tool.italic,
                'STRIKE' : context.tool.strike,
                'SIZE' : context.tool.fontSize
            };

            var fontFamilyMap = {};
            if(!!context.tool.list_fontFamily) {
                var list_fontFamily = context.tool.list_fontFamily.children;
                var fontFamilyLen = list_fontFamily.length;

                for(var i=0; i<fontFamilyLen; i++) {
                    fontFamilyMap[list_fontFamily[i].firstChild.getAttribute("data-value").replace(/\s*/g,"")] = list_fontFamily[i].firstChild.getAttribute("data-txt");
                }

                if(!!context.tool.list_fontFamily_add) {
                    list_fontFamily = context.tool.list_fontFamily_add.children;
                    fontFamilyLen = list_fontFamily.length;
                    for(var i=0; i<fontFamilyLen; i++) {
                        fontFamilyMap[list_fontFamily[i].firstChild.getAttribute("data-value").replace(/\s*/g,"")] = list_fontFamily[i].firstChild.getAttribute("data-txt");
                    }
                }
            }

            return {
                commandMap : commandMap,
                fontFamilyMap : fontFamilyMap
            };
        })(context);

        /** Practical editor function
         * This function is 'this' used by other plugins */
        var editor = SUNEDITOR.editor = {
            context : context,
            loadedPlugins : {},
            submenu : null,
            originSub : null,
            modalForm : null,
            editLink : null,
            tabSize : 4,
            fontSizeUnit : "pt",

            /** Add module script File */
            setScriptHead : function(directory, moduleName, callBackFunction, targetElement) {
                var callBack_moduleAdd = function(targetElement) {
                    SUNEDITOR.plugin[moduleName].add(this, targetElement);
                    this.loadedPlugins[moduleName] = true;
                    callBackFunction();
                }.bind(this, targetElement);

                if(!SUNEDITOR.plugin[moduleName]) {
                    var scriptFile = document.createElement("script");
                    scriptFile.type = "text/javascript";
                    scriptFile.src = func.getBasePath+'plugins/'+directory+'/'+moduleName+'.js';
                    scriptFile.onload = callBack_moduleAdd;

                    document.getElementsByTagName("head")[0].appendChild(scriptFile);
                }
                else if(!this.loadedPlugins[moduleName]) {
                    callBack_moduleAdd();
                }
                else {
                    callBackFunction();
                }
            },

            /** focus to wysiwyg area */
            focus : function(){
                context.element.wysiwygWindow.document.body.focus();
            },

            isEdgePoint : function(container, offset) {
                return (offset === 0) || (offset === container.nodeValue.length);
            },

            createRange : function() {
                return context.element.wysiwygWindow.document.createRange();
            },

            getSelection : function() {
                return context.element.wysiwygWindow.getSelection();
            },

            getSelectionNode : function() {
                return this.getSelection().extentNode || this.getSelection().anchorNode;
            },

            getRange : function() {
                var selection = this.getSelection();
                var nativeRng = null;

                if(selection.rangeCount > 0) {
                    nativeRng = selection.getRangeAt(0);
                } else {
                    selection = context.argument._copySelection;

                    nativeRng = this.createRange();
                    nativeRng.setStart(selection.anchorNode, selection.anchorOffset);
                    nativeRng.setEnd(selection.focusNode, selection.focusOffset);
                }

                return nativeRng;
            },

            setRange : function(startCon, startOff, endCon, endOff) {
                var range = this.createRange();
                range.setStart(startCon, startOff);
                range.setEnd(endCon, endOff);

                var selection = this.getSelection();
                if (selection.rangeCount > 0) {
                    selection.removeAllRanges();
                }
                selection.addRange(range);
            },

            execCommand : function(command, showDefaultUI, value) {
                context.element.wysiwygWindow.document.execCommand(command, showDefaultUI, value);
            },

            subOn : function(element) {
                editor.submenu = element.nextElementSibling;
                editor.submenu.style.display = "block";
                editor.originSub = editor.submenu.previousElementSibling;
            },

            subOff : function() {
                if(!!this.submenu) {
                    this.submenu.style.display = "none";
                    this.submenu = null;
                }
                if(!!context.image && !!context.image._imageElement) {
                    SUNEDITOR.plugin.image.cancel_resize_image.call(this);
                }
                if(!!this.editLink) {
                    context.link.linkBtn.style.display = "none";
                    context.link._linkAnchor = null;
                    context.dialog.linkText.value = "";
                    context.dialog.linkAnchorText.value = "";
                    context.dialog.linkNewWindowCheck.checked = false;
                    this.editLink = null;
                }
            },

            toggleFrame : function() {
                if(!context.argument._wysiwygActive) {
                    var ec = {"&amp;":"&","&nbsp;":"\u00A0","&quot;":"\"","&lt;":"<","&gt;":">"};
                    var source_html = context.element.source.value.replace(/&[a-z]+;/g, function(m){ return (typeof ec[m] === "string")?ec[m]:m; });
                    context.element.wysiwygWindow.document.body.innerHTML = source_html.trim().length > 0? source_html: "<p>&#65279</p>";
                    context.element.wysiwygWindow.document.body.scrollTop = 0;
                    context.element.source.style.display = "none";
                    context.element.wysiwygElement.style.display = "block";
                    context.argument._wysiwygActive = true;
                }
                else {
                    context.element.source.value = context.element.wysiwygWindow.document.body.innerHTML.trim().replace(/<\/p>(?=[^\n])/gi, "<\/p>\n");
                    context.element.wysiwygElement.style.display = "none";
                    context.element.source.style.display = "block";
                    context.argument._wysiwygActive = false;
                }
            },

            toggleFullScreen : function(element) {
                if(!context.argument._isFullScreen) {
                    context.element.topArea.style.position = "fixed";
                    context.element.topArea.style.top = "0";
                    context.element.topArea.style.left = "0";
                    context.element.topArea.style.width = "100%";
                    context.element.topArea.style.height = "100%";

                    context.argument._innerHeight_fullScreen = (window.innerHeight - context.tool.bar.offsetHeight);
                    context.element.editorArea.style.height = context.argument._innerHeight_fullScreen + "px";

                    dom.removeClass(element.firstElementChild, 'ico_full_screen_e');
                    dom.addClass(element.firstElementChild, 'ico_full_screen_i');
                }
                else {
                    context.element.topArea.style.cssText = context.argument._originCssText;
                    context.element.editorArea.style.height = context.argument._innerHeight + "px";

                    dom.removeClass(element.firstElementChild, 'ico_full_screen_i');
                    dom.addClass(element.firstElementChild, 'ico_full_screen_e');
                }

                context.argument._isFullScreen = !context.argument._isFullScreen;
            },

            appendP : function(element) {
                var oP = document.createElement("P");
                oP.innerHTML = '&#65279';
                element.parentNode.insertBefore(oP, element.nextElementSibling);
            },

            showLoading : function() {
                context.element.loading.style.display = "block";
            },

            closeLoading : function() {
                context.element.loading.style.display = "none";
            },

            removeNode : function() {
                var ELEMENT_NODE = 1;
                var TEXT_NODE = 3;
                var nativeRng = this.getRange();

                var startCon = nativeRng.startContainer;
                var startOff = nativeRng.startOffset;
                var endCon = nativeRng.endContainer;
                var endOff = nativeRng.endOffset;
                var commonCon = nativeRng.commonAncestorContainer;

                var beforeNode = null;
                var afterNode = null;

                var childNodes = dom.getListChildNodes(commonCon);
                var startIndex = dom.getArrayIndex(childNodes, startCon);
                var endIndex = dom.getArrayIndex(childNodes, endCon);

                var startNode = startCon;
                for(var i=startIndex+1; i>=0; i--) {
                    if(childNodes[i] === startNode.parentNode && /^SPAN$/i.test(childNodes[i].nodeName) && childNodes[i].firstChild === startNode && startOff === 0) {
                        startIndex = i;
                        startNode = startNode.parentNode;
                    }
                }

                var endNode = endCon;
                for(var i=endIndex-1; i>startIndex; i--) {
                    if(childNodes[i] === endNode.parentNode && childNodes[i].nodeType === ELEMENT_NODE) {
                        childNodes.splice(i, 1);
                        endNode = endNode.parentNode;
                        --endIndex;
                    }
                }

                for(var i=startIndex; i<=endIndex; i++) {
                    var item = childNodes[i];

                    if(item.length === 0 || (item.nodeType === TEXT_NODE && item.data === undefined)) {
                        dom.removeItem(item);
                        continue;
                    }

                    if(item === startCon) {
                        if(startCon.nodeType === ELEMENT_NODE) {
                            beforeNode = document.createTextNode(startCon.textContent);
                        } else {
                            beforeNode = document.createTextNode(startCon.substringData(0, startOff));
                        }

                        if(beforeNode.length > 0) {
                            startCon.data = beforeNode.data;
                        } else {
                            dom.removeItem(startCon);
                        }

                        continue;
                    }

                    if(item === endCon) {
                        if(endCon.nodeType === ELEMENT_NODE) {
                            afterNode = document.createTextNode(endCon.textContent);
                        } else {
                            afterNode = document.createTextNode(endCon.substringData(endOff, (endCon.length - endOff)));
                        }

                        if(afterNode.length > 0) {
                            endCon.data = afterNode.data;
                        } else {
                            dom.removeItem(endCon);
                        }

                        continue;
                    }

                    dom.removeItem(item);
                }
            },

            insertNode : function(oNode) {
                var selection = this.getSelection();
                var nativeRng = this.getRange();

                var startCon = nativeRng.startContainer;
                var startOff = nativeRng.startOffset;
                var endCon = nativeRng.endContainer;
                var endOff = nativeRng.endOffset;

                var parentNode = startCon;
                if(/^#text$/i.test(startCon.nodeName)) {
                    parentNode = startCon.parentNode;
                }

                var rightNode = null;

                /** 범위선택 없을때 */
                if(startCon === endCon && startOff === endOff) {
                    if(!!selection.focusNode && /^#text$/i.test(selection.focusNode.nodeName)) {
                        rightNode = selection.focusNode.splitText(endOff);
                        parentNode.insertBefore(oNode, rightNode);
                    }
                    else {
                        if(parentNode.lastChild !== null && /^BR$/i.test(parentNode.lastChild.nodeName)) {
                            parentNode.removeChild(parentNode.lastChild);
                        }
                        parentNode.appendChild(oNode);
                    }
                }
                /** 범위선택 했을때 */
                else {
                    var removeNode = startCon;
                    var isSameContainer = startCon === endCon;
                    var endLen = endCon.data.length;

                    if(isSameContainer) {
                        if(!this.isEdgePoint(endCon, endOff)) {
                            rightNode = endCon.splitText(endOff);
                        }

                        if(!this.isEdgePoint(startCon, startOff)) {
                            removeNode = startCon.splitText(startOff);
                        }

                        parentNode.removeChild(removeNode);
                    }
                    else {
                        try {
                            selection.deleteFromDocument();
                        } catch(e) {
                            this.removeNode();
                        }

                        if(endLen === endCon.data.length) rightNode = endCon.nextSibling;
                        else rightNode = endCon;
                    }

                    try {
                        parentNode.insertBefore(oNode, rightNode);
                    } catch(e) {
                        parentNode.appendChild(oNode);
                    }

                    this.setRange(oNode, 0, oNode, 0);
                }
            },

            resize_editor : function(e) {
                var resizeInterval = (e.clientY - context.argument._resizeClientY);

                context.element.editorArea.style.height = (context.element.editorArea.offsetHeight + resizeInterval) + "px";

                context.argument._innerHeight = (context.element.editorArea.offsetHeight + resizeInterval);

                context.argument._resizeClientY = e.clientY;
            }
        };

        /** event function */
        var event = {
            resize_window : function() {
                // if(context.tool.barHeight == context.tool.bar.offsetHeight) return;

                if(context.argument._isFullScreen) {
                    context.argument._innerHeight_fullScreen += ((context.tool.barHeight - context.tool.bar.offsetHeight) + (this.innerHeight - context.argument._windowHeight));
                    context.element.editorArea.style.height = context.argument._innerHeight_fullScreen + "px";
                }

                context.tool.barHeight = context.tool.bar.offsetHeight;
                context.argument._windowHeight = this.innerHeight;
            },

            touchstart_toolbar : function() {
                context.argument._isTouchMove = false;
            },

            touchmove_toolbar : function() {
                context.argument._isTouchMove = true;
            },

            onClick_toolbar : function(e) {
                if(context.argument._isTouchMove) return true;

                var targetElement = e.target;
                var display = targetElement.getAttribute("data-display");
                var command = targetElement.getAttribute("data-command");
                var className = targetElement.className;

                while(!command && !display && !/layer_|editor_tool/.test(className) && !/^BODY$/i.test(targetElement.tagName)){
                    targetElement = targetElement.parentNode;
                    command = targetElement.getAttribute("data-command");
                    display = targetElement.getAttribute("data-display");
                    className = targetElement.className;
                }

                if(!command && !display) return true;

                e.preventDefault();
                e.stopPropagation();

                editor.focus();

                /** Dialog, Submenu */
                if(!!display || /^BODY$/i.test(targetElement.tagName)) {
                    editor.subOff();

                    if(/submenu/.test(display)){
                        editor.setScriptHead('submenu', command, function(){editor.subOn(targetElement)}, targetElement);
                    }
                    else if(/modal/.test(display)) {
                        editor.setScriptHead('dialog', 'dialog', function(){
                            editor.setScriptHead('dialog', command, SUNEDITOR.plugin.dialog.openDialog.bind(editor, command));
                        });
                    }

                    return;
                }

                /** default command */
                if(!!command) {
                    var value = targetElement.getAttribute("data-value");
                    var txt = targetElement.getAttribute("data-txt");

                    switch(command) {
                        case 'fontName':
                            dom.changeTxt(editor.originSub.firstElementChild, txt);
                            editor.execCommand(command, false, value);
                            break;
                        case 'sorceFrame':
                            editor.toggleFrame();
                            dom.toggleClass(targetElement, 'on');
                            break;
                        case 'fullScreen':
                            editor.toggleFullScreen(targetElement);
                            dom.toggleClass(targetElement, "on");
                            break;
                        case 'indent':
                        case 'outdent':
                        case 'redo':
                        case 'undo':
                            editor.execCommand(command, false);
                            break;
                        default :
                            editor.execCommand(command, false, value);
                            dom.toggleClass(targetElement, "on");
                    }

                    editor.subOff();
                }
            },

            onMouseDown_wysiwyg : function(e) {
                e.stopPropagation();

                var targetElement = e.target;
                editor.subOff();

                if(/^IMG$/i.test(targetElement.nodeName)) {
                    editor.setScriptHead('dialog', 'image', SUNEDITOR.plugin.image.call_image_resize_controller.bind(editor, targetElement));
                }
                else if(/^HTML$/i.test(targetElement.nodeName)) {
                    e.preventDefault();
                    editor.focus();
                }
            },

            onSelectionChange_wysiwyg : function() {
                context.argument._copySelection = dom.copyObj(editor.getSelection());
                context.argument._selectionNode = editor.getSelectionNode();

                var selectionParent = context.argument._selectionNode;
                var findFont = true;
                var findSize = true;
                var findA = true;
                var map = "B|U|I|STRIKE|FONT|SIZE|";
                var check = new RegExp(map, "i");
                while(!/^P$|^BODY$|^HTML$|^DIV$/i.test(selectionParent.nodeName)) {
                    var nodeName = (/^STRONG$/.test(selectionParent.nodeName)? 'B': (/^EM/.test(selectionParent.nodeName)? 'I': selectionParent.nodeName));

                    /** Font */
                    if(findFont && (/^FONT$/i.test(nodeName) && selectionParent.face.length > 0)) {
                        var selectFont = list.fontFamilyMap[selectionParent.face.replace(/\s*/g,"")];
                        dom.changeTxt(list.commandMap[nodeName], selectFont);
                        findFont = false;
                        map = map.replace(nodeName+"|", "");
                        check = new RegExp(map, "i");
                    }

                    /** A */
                    if(findA && /^A$/i.test(selectionParent.nodeName) && context.link && editor.editLink !== context.link.linkBtn) {
                        editor.setScriptHead('dialog', 'link', SUNEDITOR.plugin.link.call_link_button.bind(editor, selectionParent));
                        findA = false;
                    } else if(findA && editor.editLink) {
                        context.link.linkBtn.style.display = "none";
                        editor.subOff();
                    }

                    /** span (font size) */
                    if(findSize && /^SPAN$/i.test(nodeName) && selectionParent.style.fontSize.length > 0) {
                        dom.changeTxt(list.commandMap["SIZE"], selectionParent.style.fontSize.match(/\d+/)[0]);
                        findSize = false;
                        map = map.replace("SIZE|", "");
                        check = new RegExp(map, "i");
                    }

                    /** command */
                    if(check.test(nodeName)) {
                        dom.addClass(list.commandMap[nodeName], "on");
                        map = map.replace(nodeName+"|", "");
                        check = new RegExp(map, "i");
                    }

                    selectionParent = selectionParent.parentNode;
                }

                /** remove */
                map = map.split("|");
                var mapLen = map.length - 1;
                for(var i=0; i<mapLen; i++) {
                    if(/^FONT$/i.test(map[i])) {
                        dom.changeTxt(list.commandMap[map[i]], context.tool.default_fontFamily);
                    }
                    else if(/^SIZE$/i.test(map[i])) {
                        dom.changeTxt(list.commandMap[map[i]], context.tool.default_fontSize);
                    }
                    else {
                        dom.removeClass(list.commandMap[map[i]], "on");
                    }
                }
            },

            onKeyDown_wysiwyg : function(e) {
                e.stopPropagation();

                var target = e.target;
                var keyCode = e.keyCode;
                var shift = e.shiftKey;
                var ctrl = e.ctrlKey;
                var alt = e.altKey;

                if(ctrl && !shift) {
                    var nodeName = "";

                    switch(keyCode) {
                        case 66: /** B */
                            e.preventDefault();
                            editor.execCommand('bold', false);
                            nodeName = 'B';
                            break;
                        case 85: /** U */
                            e.preventDefault();
                            editor.execCommand('underline', false);
                            nodeName = 'U';
                            break;
                        case 73: /** I */
                            e.preventDefault();
                            editor.execCommand('italic', false);
                            nodeName = 'I';
                            break;
                        case 89: /** Y */
                            e.preventDefault();
                            editor.execCommand('redo', false);
                            break;
                        case 90: /** Z */
                            e.preventDefault();
                            editor.execCommand('undo', false);
                    }

                    if(!!nodeName) {
                        dom.toggleClass(list.commandMap[nodeName], "on");
                    }

                    return;
                }

                /** ctrl + shift + S */
                if(ctrl && shift && keyCode === 83) {
                    e.preventDefault();
                    editor.execCommand('strikethrough', false);
                    dom.toggleClass(list.commandMap['STRIKE'], "on");

                    return;
                }

                switch(keyCode) {
                    case 8: /**backspace key*/
                        if(target.childElementCount === 1 && target.children[0].innerHTML === "<br/>") {
                            e.preventDefault();
                            return false;
                        }
                        break;
                    case 9: /**tab key*/
                        e.preventDefault();
                        if(ctrl || alt) break;

                        var currentNode = context.argument._selectionNode || editor.getSelection().anchorNode;
                        while(!/^TD$/i.test(currentNode.tagName) && !/^BODY$/i.test(currentNode.tagName)) {
                            currentNode = currentNode.parentNode;
                        }

                        if(!!currentNode && /^TD$/i.test(currentNode.tagName)) {
                            var table = dom.getParentNode(currentNode, "table");
                            var cells = dom.getListChildren(table, dom.isCell);
                            var idx = shift? dom.prevIdx(cells, currentNode): dom.nextIdx(cells, currentNode);

                            if(idx === cells.length && !shift) idx = 0;
                            if(idx === -1 && shift) idx = cells.length - 1;

                            var moveCell = cells[idx];
                            if(!moveCell) return false;

                            var range = editor.createRange();
                            range.setStart(moveCell, 0);
                            range.setEnd(moveCell, 0);

                            var selection = editor.getSelection();
                            if (selection.rangeCount > 0) {
                                selection.removeAllRanges();
                            }
                            selection.addRange(range);

                            break;
                        }

                        /** P 노드일때 */
                        if(shift) break;

                        var tabText = context.element.wysiwygWindow.document.createTextNode(new Array(editor.tabSize + 1).join("\u00A0"));
                        editor.insertNode(tabText);

                        var selection = editor.getSelection();
                        var rng = editor.createRange();

                        rng.setStart(tabText, editor.tabSize);
                        rng.setEnd(tabText, editor.tabSize);

                        if (selection.rangeCount > 0) {
                            selection.removeAllRanges();
                        }

                        selection.addRange(rng);

                        break;
                }
            },

            onScroll_wysiwyg : function() {
                if(!!context.image && !!context.image._imageElement) {
                    context.image.imageResizeDiv.style.display = "none";
                    context.image.imageResizeBtn.style.display = "none";
                    context.image._imageElement = null;
                }
            },

            onMouseDown_resizeBar : function(e) {
                e.stopPropagation();

                context.argument._resizeClientY = e.clientY;
                context.element.resizeBackground.style.display = "block";

                function closureFunc() {
                    context.element.resizeBackground.style.display = "none";
                    document.removeEventListener('mousemove', editor.resize_editor);
                    document.removeEventListener('mouseup', closureFunc);
                }

                document.addEventListener('mousemove', editor.resize_editor);
                document.addEventListener('mouseup', closureFunc);
            }
        };

        /** add event listeners */
        window.onresize = function(){event.resize_window()};
        context.tool.bar.addEventListener('touchstart', event.touchstart_toolbar);
        context.tool.bar.addEventListener('touchmove', event.touchmove_toolbar);
        context.tool.bar.addEventListener('touchend', event.onClick_toolbar);
        context.tool.bar.addEventListener('click', event.onClick_toolbar);
        context.element.wysiwygWindow.addEventListener('mousedown', event.onMouseDown_wysiwyg);
        context.element.wysiwygWindow.addEventListener('keydown', event.onKeyDown_wysiwyg);
        context.element.wysiwygWindow.addEventListener('scroll', event.onScroll_wysiwyg);
        context.element.wysiwygWindow.document.addEventListener('selectionchange', event.onSelectionChange_wysiwyg);
        context.element.resizebar.addEventListener('mousedown', event.onMouseDown_resizeBar);

        /** User function */
        return {
            save : function() {
                if(context.argument._wysiwygActive) {
                    context.element.textElement.innerHTML = context.element.wysiwygWindow.document.body.innerHTML;
                } else {
                    context.element.textElement.innerHTML = context.element.source.value;
                }
            },

            getContent : function() {
                var content = "";
                if(context.argument._wysiwygActive) {
                    content = context.element.wysiwygWindow.document.body.innerHTML;
                } else {
                    content = context.element.source.value;
                }
                return content;
            },

            setContent : function(content) {
                if(context.argument._wysiwygActive) {
                    context.element.wysiwygWindow.document.body.innerHTML = content;
                } else {
                    context.element.source.value = content;
                }
            },

            appendContent : function(content) {
                if(context.argument._wysiwygActive) {
                    var oP = document.createElement("P");
                    oP.innerHTML = content;
                    context.element.wysiwygWindow.document.body.appendChild(oP);
                } else {
                    context.element.source.value += content;
                }
            },

            disabled : function() {
                context.tool.cover.style.display = "block";
                context.element.wysiwygWindow.document.body.setAttribute("contenteditable", false);
            },

            enabled : function() {
                context.tool.cover.style.display = "none";
                context.element.wysiwygWindow.document.body.setAttribute("contenteditable", true);
            },

            show : function() {
                context.element.topArea.style.cssText = context.argument._originCssText;
            },

            hide : function() {
                context.element.topArea.style.display = "none";
            },

            destroy : function() {
                context.element.topArea.parentNode.removeChild(context.element.topArea);
                context.element.textElement.style.display = "";

                delete this.save;
                delete this.getContent;
                delete this.setContent;
                delete this.appendContent;
                delete this.disabled;
                delete this.enabled;
                delete this.show;
                delete this.hide;
                delete this.destroy;
            }
        };
    };

    /**
     * Create editor HTML
     * @param options - user option
     */
    var createEditor = function (options){
        var lang = SUNEDITOR.lang = SUNEDITOR.lang? SUNEDITOR.lang: SUNEDITOR.defaultLang;

        return (function() {
            var html = '<div class="sun-editor-id-toolbar-cover"></div>'+
                /** 글꼴, 포멧 */
                '<div class="tool_module">'+
                '    <ul class="editor_tool">';
            if(options.showFont) {
                html += ''+
                    '        <li>'+
                    '            <button type="button" class="btn_editor btn_font" title="'+lang.toolbar.fontFamily+'" data-display="submenu">'+
                    '                <span class="txt sun-editor-font-family">'+lang.toolbar.fontFamily+'</span><span class="img_editor ico_more"></span>'+
                    '            </button>'+
                    '            <div class="layer_editor" style="display: none;">'+
                    '                <div class="inner_layer list_family">'+
                    '                    <ul class="list_editor sun-editor-list-font-family">'+
                    '                        <li><button type="button" class="btn_edit default" data-command="fontName" data-value="inherit" data-txt="'+lang.toolbar.fontFamily+'" style="font-family:inherit;">'+lang.toolbar.fontFamilyDelete+'</button></li>'+
                    '                        <li><button type="button" class="btn_edit" data-command="fontName" data-value="Arial" data-txt="Arial" style="font-family:Arial;">Arial</button></li>'+
                    '                        <li><button type="button" class="btn_edit" data-command="fontName" data-value="Comic Sans MS" data-txt="Comic Sans MS" style="font-family:Comic Sans MS;">Comic Sans MS</button></li>'+
                    '                        <li><button type="button" class="btn_edit" data-command="fontName" data-value="Courier New,Courier" data-txt="Courier New" style="font-family:Courier New,Courier;">Courier New</button></li>'+
                    '                        <li><button type="button" class="btn_edit" data-command="fontName" data-value="Georgia" data-txt="Georgia" style="font-family:Georgia;">Georgia</button></li>'+
                    '                        <li><button type="button" class="btn_edit" data-command="fontName" data-value="tahoma" data-txt="tahoma" style="font-family:tahoma;">Tahoma</button></li>'+
                    '                        <li><button type="button" class="btn_edit" data-command="fontName" data-value="Trebuchet MS,Helvetica" data-txt="Trebuchet MS" style="font-family:Trebuchet MS,Helvetica;">Trebuchet MS</button></li>'+
                    '                        <li><button type="button" class="btn_edit" data-command="fontName" data-value="Verdana" data-txt="Verdana" style="font-family:Verdana;">Verdana</button></li>'+
                    '                    </ul>';
                /** 사용자 추가 글꼴 */
                if(options.addFont) {
                    html += '        <ul class="list_editor list_family_add sun-editor-list-font-family-add">';
                    var addFontLen = options.addFont.length;
                    for (var i = 0; i < addFontLen; i++) {
                        var font = options.addFont[i];
                        html += '        <li><button type="button" class="btn_edit" data-command="fontName" data-value="'+font.value+'" data-txt="'+font.text+'" style="font-family:'+font.value+'">'+font.text+'</button></li>';
                    }
                    html += '        </ul>';
                }

                html += '        </div>'+
                    '            </div>'+
                    '        </li>';
            }
            if(options.showFormats) {
                html += ''+
                    '        <li>'+
                    '            <button type="button" class="btn_editor btn_format" title="'+lang.toolbar.formats+'" data-command="formatBlock" data-display="submenu">'+
                    '                <span class="txt">'+lang.toolbar.formats+'</span><span class="img_editor ico_more"></span>'+
                    '            </button>'+
                    '        </li>' ;
            }
            if(options.showFontSize) {
                html += ''+
                    '        <li>'+
                    '            <button type="button" class="btn_editor btn_size" title="'+lang.toolbar.fontSize+'" data-command="fontSize" data-display="submenu">'+
                    '                <span class="txt sun-editor-font-size">'+lang.toolbar.fontSize+'</span><span class="img_editor ico_more"></span>'+
                    '            </button>'+
                    '        </li>' ;
            }
            html += '</ul>'+
                '</div>'+
                /** 굵게, 밑줄 등 */
                '<div class="tool_module">'+
                '   <ul class="editor_tool">';
            if(options.showBold) {
                html += ''+
                    '       <li>'+
                    '           <button type="button" class="btn_editor sun-editor-id-bold" title="'+lang.toolbar.bold+' (Ctrl+B)" data-command="bold"><div class="ico_bold"></div></button>'+
                    '       </li>';
            }
            if(options.showUnderline) {
                html += ''+
                    '       <li>'+
                    '           <button type="button" class="btn_editor sun-editor-id-underline" title="'+lang.toolbar.underline+' (Ctrl+U)" data-command="underline"><div class="ico_underline"></div></button>'+
                    '       </li>';
            }
            if(options.showItalic) {
                html += ''+
                    '       <li>'+
                    '           <button type="button" class="btn_editor sun-editor-id-italic" title="'+lang.toolbar.italic+' (Ctrl+I)" data-command="italic"><div class="ico_italic"></div></button>'+
                    '       </li>';
            }
            if(options.showStrike) {
                html += ''+
                    '       <li>'+
                    '           <button type="button" class="btn_editor sun-editor-id-strike" title="'+lang.toolbar.strike+' (Ctrl+SHIFT+S)" data-command="strikethrough"><div class="ico_strike"></div></button>'+
                    '       </li>';
            }
            html +='</ul>'+
                '</div>'+
                /** 색상 선택 */
                '<div class="tool_module">'+
                '    <ul class="editor_tool">';
            if(options.showFontColor) {
                html += ''+
                    '        <li>'+
                    '            <strong class="screen_out">'+lang.toolbar.fontColor+'</strong>'+
                    '            <button type="button" class="btn_editor" title="'+lang.toolbar.fontColor+'" data-command="foreColor" data-display="submenu">'+
                    '                <div class="ico_fcolor">'+
                    '                    <em class="color_font" style="background-color:#1f92fe"></em>'+
                    '                </div>'+
                    '            </button>'+
                    '        </li>';
            }
            if(options.showHiliteColor) {
                html += ''+
                    '        <li>'+
                    '            <strong class="screen_out">'+lang.toolbar.hiliteColor+'</strong>'+
                    '            <button type="button" class="btn_editor btn_fbgcolor" title="'+lang.toolbar.hiliteColor+'" data-command="hiliteColor" data-display="submenu">'+
                    '                <div class="img_editor ico_fcolor_w">'+
                    '                    <em class="color_font" style="background-color:#1f92fe"></em>'+
                    '                </div>'+
                    '            </button>'+
                    '        </li>';
            }
            html +='</ul>'+
                '</div>';
            /** 들여쓰기, 내어쓰기 */
            if(options.showInOutDent) {
                html += ''+
                    '<div class="tool_module">'+
                    '    <ul class="editor_tool">'+
                    '        <li>'+
                    '            <button type="button" class="btn_editor" title="'+lang.toolbar.indent+'" data-command="indent">'+
                    '                <div class="img_editor ico_indnet"></div>'+
                    '            </button>'+
                    '        </li>'+
                    '        <li>'+
                    '            <button type="button" class="btn_editor" title="'+lang.toolbar.outdent+'" data-command="outdent">'+
                    '                <div class="img_editor ico_outdent"></div>'+
                    '            </button>'+
                    '        </li>'+
                    '    </ul>'+
                    '</div>';
            }
            /** 정렬, 구분선 상자 */
            html += '<div class="tool_module">'+
                '    <ul class="editor_tool">';
            if(options.showAlign) {
                html += ''+
                    '        <li>'+
                    '            <strong class="screen_out">'+lang.toolbar.align+'</strong>'+
                    '            <button type="button" class="btn_editor btn_align" title="'+lang.toolbar.align+'" data-command="align" data-display="submenu">'+
                    '                <span class="img_editor ico_align_l">'+lang.toolbar.alignLeft+'</span>'+
                    '            </button>'+
                    '        </li>';
            }
            if(options.showList) {
                html += ''+
                    '        <li>'+
                    '            <button type="button" class="btn_editor" title="'+lang.toolbar.list+'" data-command="list" data-display="submenu">'+
                    '                <div class="img_editor ico_list ico_list_num"></div>'+
                    '            </button>'+
                    '        </li>';
            }
            if(options.showLine) {
                html += ''+
                    '        <li>'+
                    '            <strong class="screen_out">'+lang.toolbar.line+'</strong>'+
                    '            <button type="button" class="btn_editor btn_line" title="'+lang.toolbar.line+'" data-command="horizontalRules" data-display="submenu">'+
                    '                <hr style="border-width: 1px 0 0; border-style: solid none none; border-color: black; border-image: initial; height: 1px;" />'+
                    '                <hr style="border-width: 1px 0 0; border-style: dotted none none; border-color: black; border-image: initial; height: 1px;" />'+
                    '                <hr style="border-width: 1px 0 0; border-style: dashed none none; border-color: black; border-image: initial; height: 1px;" />'+
                    '            </button>'+
                    '        </li>';
            }
            html +='</ul>'+
                '</div>'+
                /** 테이블, 링크, 사진 */
                '<div class="tool_module">'+
                '    <ul class="editor_tool">';
            if(options.showTable) {
                html += ''+
                    '        <li>'+
                    '            <button class="btn_editor" title="'+lang.toolbar.table+'" data-display="submenu" data-command="table">'+
                    '                <div class="img_editor ico_table"></div>'+
                    '            </button>'+
                    '        </li>';
            }
            if(options.showLink) {
                html += ''+
                    '        <li>'+
                    '            <button class="btn_editor" title="'+lang.toolbar.link+'" data-display="modal" data-command="link">'+
                    '                <div class="img_editor ico_url"></div>'+
                    '            </button>'+
                    '        </li>';
            }
            if(options.showImage) {
                html += ''+
                    '        <li>'+
                    '            <button class="btn_editor" title="'+lang.toolbar.image+'" data-display="modal" data-command="image">'+
                    '                <div class="img_editor ico_picture"></div>'+
                    '            </button>'+
                    '        </li>';
            }
            html += '</ul>'+
                '</div>'+
                /** 동영상, 전체화면, 소스편집 */
                '<div class="tool_module">'+
                '    <ul class="editor_tool">';
            if(options.showVideo) {
                html += ''+
                    '        <li>'+
                    '            <button class="btn_editor" title="'+lang.toolbar.video+'" data-display="modal" data-command="video">'+
                    '                <div class="img_editor ico_video"></div>'+
                    '            </button>'+
                    '        </li>';
            }
            if(options.showFullScreen) {
                html += ''+
                    '        <li>'+
                    '            <button class="btn_editor" title="'+lang.toolbar.fullScreen+'" data-command="fullScreen">'+
                    '                <div class="img_editor ico_full_screen_e"></div>'+
                    '            </button>'+
                    '        </li>';
            }
            if(options.showCodeView) {
                html += ''+
                    '        <li>'+
                    '            <button class="btn_editor" title="'+lang.toolbar.htmlEditor+'" data-command="sorceFrame">'+
                    '                <div class="img_editor ico_html"></div>'+
                    '            </button>'+
                    '        </li>';
            }
            html += '</ul>'+
                '</div>'+
                /** 실행취소 관련 */
                '<div class="tool_module">'+
                '    <ul class="editor_tool">';
            if(options.showUndo) {
                html += ''+
                    '        <li>'+
                    '            <button class="btn_editor" title="'+lang.toolbar.undo+' (Ctrl+Z)" data-command="undo">'+
                    '                <div class="img_editor ico_undo"></div>'+
                    '            </button>'+
                    '        </li>';
            }
            if(options.showRedo) {
                html += ''+
                    '        <li>'+
                    '            <button class="btn_editor" title="'+lang.toolbar.redo+' (Ctrl+Y)" data-command="redo">'+
                    '                <div class="img_editor ico_redo"></div>'+
                    '            </button>'+
                    '        </li>';
            }
            html += '</ul>'+
                '</div>';

            return html;
        })();
    };

    /**
     * document create - call [createEditor]
     * @param element
     * @param options
     * @returns {{constructed: Element, options: *}}
     * @constructor
     */
    var Constructor = function(element, options) {
        if(!(typeof options === "object")) options = {};

        /** 사용자 옵션 초기화 */
        options.addFont = options.addFont || null;
        options.videoX = options.videoX || 560;
        options.videoY = options.videoY || 315;
        options.imageSize = options.imageSize || '350px';
        options.height = /^\d+/.test(options.height)?  (/^\d+$/.test(options.height)? options.height+"px": options.height): element.clientHeight+"px";
        options.width = /^\d+/.test(options.width)?  (/^\d+$/.test(options.width)? options.width+"px": options.width): (/%|auto/.test(element.style.width)? element.style.width: element.clientWidth+"px");
        options.display = options.display || 'block';
        options.imageUploadUrl = options.imageUploadUrl || null;
        options.editorIframeFont = options.editorIframeFont || 'inherit';

        /** 툴바 버튼 보이기 설정 */
        options.showFont = options.showFont !== undefined? options.showFont: true;
        options.showFormats = options.showFormats !== undefined? options.showFormats: true;
        options.showFontSize = options.showFontSize !== undefined? options.showFontSize: true;
        options.showBold = options.showBold !== undefined? options.showBold: true;
        options.showUnderline = options.showUnderline !== undefined? options.showUnderline: true;
        options.showItalic = options.showItalic !== undefined? options.showItalic: true;
        options.showStrike = options.showStrike !== undefined? options.showStrike: true;
        options.showFontColor = options.showFontColor !== undefined? options.showFontColor: true;
        options.showHiliteColor = options.showHiliteColor !== undefined? options.showHiliteColor: true;
        options.showInOutDent = options.showInOutDent !== undefined? options.showInOutDent: true;
        options.showAlign = options.showAlign !== undefined? options.showAlign: true;
        options.showList = options.showList !== undefined? options.showList: true;
        options.showLine = options.showLine !== undefined? options.showLine: true;
        options.showTable = options.showTable !== undefined? options.showTable: true;
        options.showLink = options.showLink !== undefined? options.showLink: true;
        options.showImage = options.showImage !== undefined? options.showImage: true;
        options.showVideo = options.showVideo !== undefined? options.showVideo: true;
        options.showFullScreen = options.showFullScreen !== undefined? options.showFullScreen: true;
        options.showCodeView = options.showCodeView !== undefined? options.showCodeView: true;
        options.showUndo = options.showUndo !== undefined? options.showUndo: true;
        options.showRedo = options.showRedo !== undefined? options.showRedo: true;

        var doc = document;

        /** suneditor div */
        var top_div = doc.createElement("DIV");
        top_div.className = "sun-editor";
        top_div.id = "suneditor_" + element.id;
        top_div.style.width = options.width;

        /** relative div */
        var relative = doc.createElement("DIV");
        relative.className = "sun-editor-container";

        /** tool bar */
        var tool_bar = doc.createElement("DIV");
        tool_bar.className = "sun-editor-id-toolbar";
        tool_bar.innerHTML = createEditor(options);

        /** inner editor div */
        var editor_div = doc.createElement("DIV");
        editor_div.className = "sun-editor-id-editorArea";
        editor_div.style.height = options.height;

        /** iframe */
        var iframe = doc.createElement("IFRAME");
        iframe.allowFullscreen = true;
        iframe.frameBorder = 0;
        iframe.className = "input_editor sun-editor-id-wysiwyg";
        iframe.style.display = "block";

        /** textarea for source view */
        var textarea = doc.createElement("TEXTAREA");
        textarea.className = "input_editor html sun-editor-id-source";
        textarea.style.display = "none";

        iframe.addEventListener("load", function(){
            this.setAttribute("scrolling", "auto");
            this.contentWindow.document.head.innerHTML = ''+
                '<meta charset=\"utf-8\" />' +
                '<style type=\"text/css\">' +
                '   body {font-family:'+options.editorIframeFont+'; margin:15px; word-break:break-all;} p {margin:0; padding:0;} blockquote {margin-top:0; margin-bottom:0; margin-right:0;}' +
                '   table {table-layout:auto; border:1px solid rgb(204, 204, 204); width:100%; max-width:100%; margin-bottom:20px; background-color:transparent; border-spacing:0; border-collapse:collapse;}'+
                '   table tr {border:1px solid #ccc;}'+
                '   table tr td {border:1px solid #ccc; padding:8px;}'+
                '</style>';
            this.contentWindow.document.body.setAttribute("contenteditable", true);
            if(element.value.length > 0) {
                this.contentWindow.document.body.innerHTML = '<p>'+element.value+'</p>';
            } else {
                this.contentWindow.document.body.innerHTML = '<p>&#65279</p>';
            }
        });

        /** resize bar */
        var resize_bar = doc.createElement("DIV");
        resize_bar.className = "sun-editor-id-resizeBar";

        /** loading box */
        var loading_box = doc.createElement("DIV");
        loading_box.className = "sun-editor-id-loading";
        loading_box.innerHTML = "<div class=\"ico-loading\"></div>";

        /** resize operation background */
        var resize_back = doc.createElement("DIV");
        resize_back.className = "sun-editor-id-resize-background";

        /** append html */
        editor_div.appendChild(iframe);
        editor_div.appendChild(textarea);
        relative.appendChild(tool_bar);
        relative.appendChild(editor_div);
        relative.appendChild(resize_bar);
        relative.appendChild(resize_back);
        relative.appendChild(loading_box);
        top_div.appendChild(relative);

        return {
            constructed : {
                _top : top_div,
                _relative : relative,
                _toolBar : tool_bar,
                _editorArea : editor_div,
                _resizeBar : resize_bar,
                _loading : loading_box,
                _resizeBack : resize_back
            },
            options : options
        };
    };

    /**
     * @param element
     * @param cons
     * @param options
     * @returns Elements of the editor
     * @constructor
     */
    var Context = function(element, cons, options) {
        /** iframe 태그 */
        var sun_wysiwyg = cons._editorArea.getElementsByClassName('sun-editor-id-wysiwyg')[0];

        /** 내부 옵션값 초기화 */
        var styleTmp = document.createElement("div");

        styleTmp.style.cssText = cons._top.style.cssText;
        if(/none/i.test(styleTmp.style.display)) {
            styleTmp.style.display = options.display;
        }

        options._originCssText = styleTmp.style.cssText;
        options._innerHeight = options.height.match(/\d+/)[0];

        return {
            argument : {
                _copySelection : null,
                _selectionNode : null,
                _wysiwygActive : true,
                _isFullScreen : false,
                _innerHeight_fullScreen : 0,
                _resizeClientY : 0,
                _originCssText : options._originCssText,
                _innerHeight : options._innerHeight,
                _windowHeight : window.innerHeight,
                _isTouchMove : false
            },
            element : {
                textElement: element,
                topArea: cons._top,
                relative: cons._relative,
                resizebar: cons._resizeBar,
                editorArea: cons._editorArea,
                wysiwygWindow: sun_wysiwyg.contentWindow,
                wysiwygElement: sun_wysiwyg,
                source: cons._editorArea.getElementsByClassName('sun-editor-id-source')[0],
                loading : cons._loading,
                resizeBackground : cons._resizeBack
            },
            tool : {
                bar : cons._toolBar,
                barHeight : cons._toolBar.offsetHeight,
                cover : cons._toolBar.getElementsByClassName('sun-editor-id-toolbar-cover')[0],
                bold : cons._toolBar.getElementsByClassName('sun-editor-id-bold')[0],
                underline : cons._toolBar.getElementsByClassName('sun-editor-id-underline')[0],
                italic : cons._toolBar.getElementsByClassName('sun-editor-id-italic')[0],
                strike : cons._toolBar.getElementsByClassName('sun-editor-id-strike')[0],
                fontFamily : cons._toolBar.getElementsByClassName('sun-editor-font-family')[0],
                default_fontFamily : (cons._toolBar.getElementsByClassName('sun-editor-font-family').length>0? cons._toolBar.getElementsByClassName('sun-editor-font-family')[0].textContent: undefined),
                list_fontFamily : cons._toolBar.getElementsByClassName('sun-editor-list-font-family')[0],
                list_fontFamily_add : cons._toolBar.getElementsByClassName('sun-editor-list-font-family-add')[0],
                fontSize : cons._toolBar.getElementsByClassName('sun-editor-font-size')[0],
                default_fontSize : (cons._toolBar.getElementsByClassName('sun-editor-font-size').length>0? cons._toolBar.getElementsByClassName('sun-editor-font-size')[0].textContent: undefined)
            },
            user : {
                videoX : options.videoX,
                videoY : options.videoY,
                imageSize : options.imageSize,
                imageUploadUrl : options.imageUploadUrl
            },
            dialog : {},
            submenu : {}
        }
    };

    /**
     * create Suneditor
     * @param elementId
     * @param options
     * @returns {{save, getContent, setContent, appendContent, disabled, enabled, show, hide, destroy}}
     */
    SUNEDITOR.create = function (elementId, options) {
        var element = document.getElementById(elementId);

        if(element === null) {
            throw Error('[SUNEDITOR.create.fail] The element for that id was not found (ID:"' + elementId +'")');
        }

        var cons = Constructor(element, options);

        if(!!document.getElementById(cons.constructed._top.id)) {
            throw Error('[SUNEDITOR.create.fail] The ID of the suneditor you are trying to create already exists (ID:"' + cons.constructed._top.id +'")');
        }

        if(/none/i.test(element.style.display)) {
            cons.constructed._top.style.display = "none";
        }

        /** Create to sibling node */
        if(typeof element.nextElementSibling === 'object') {
            element.parentNode.insertBefore(cons.constructed._top, element.nextElementSibling);
        } else {
            element.parentNode.appendChild(cons.constructed._top);
        }

        element.style.display = "none";

        return core(Context(element, cons.constructed, cons.options), dom, func);
    };

    /**
     * destroy Suneditor
     * @param elementId
     */
    SUNEDITOR.destroy = function(elementId) {
        var element = document.getElementById('suneditor_' + elementId);
        element.parentNode.removeChild(element);
        document.getElementById(elementId).style.display = "";
    };

})(SUNEDITOR);