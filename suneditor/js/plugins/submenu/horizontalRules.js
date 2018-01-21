/*
 * wysiwyg web editor
 *
 * suneditor.js
 * Copyright 2017 JiHong Lee.
 * MIT license.
 */
(function () {
    SUNEDITOR.plugin.horizontalRules = {
        add: function (_this, targetElement) {
            /** set submenu */
            var listDiv = eval(this.setSubmenu());

            /** add event listeners */
            listDiv.getElementsByTagName('UL')[0].addEventListener('click', this.horizontalRulesPick.bind(_this));

            /** append html */
            targetElement.parentNode.appendChild(listDiv);
        },

        setSubmenu: function () {
            var listDiv = document.createElement('DIV');
            listDiv.className = 'layer_editor layer_line';
            listDiv.style.display = 'none';

            listDiv.innerHTML = ''+
                '<div class="inner_layer inner_layer_type2">'+
                '   <ul class="list_editor">'+
                '       <li>'+
                '           <button type="button" class="btn_edit btn_line" data-command="horizontalRules" data-value="solid">'+
                '               <hr style="border-width: 1px 0 0; border-style: solid none none; border-color: black; border-image: initial; height: 1px;" />'+
                '           </button>'+
                '       </li>'+
                '       <li>'+
                '           <button type="button" class="btn_edit btn_line" data-command="horizontalRules" data-value="dotted">'+
                '               <hr style="border-width: 1px 0 0; border-style: dotted none none; border-color: black; border-image: initial; height: 1px;" />'+
                '           </button>'+
                '       </li>'+
                '       <li>'+
                '           <button type="button" class="btn_edit btn_line" data-command="horizontalRules" data-value="dashed">'+
                '               <hr style="border-width: 1px 0 0; border-style: dashed none none; border-color: black; border-image: initial; height: 1px;" />'+
                '           </button>'+
                '       </li>'+
                '   </ul>'+
                '</div>';

            return listDiv;
        },

        appendHr : function(color, px, value) {
            var borderStyle = color + " " + px + " " +value;
            var oHr = document.createElement("HR");
            oHr.style.border = "black 0px none";
            oHr.style.borderTop = borderStyle;
            oHr.style.height = "1px";

            var pNode = this.context.argument._selectionNode.parentNode;
            if(/body/i.test(pNode)) pNode = this.context.argument._selectionNode;

            pNode.appendChild(oHr);
            this.appendP(oHr);
        },

        horizontalRulesPick : function (e) {
            if(!/btn_edit/.test(e.target.className)) {
                return false;
            }

            e.preventDefault();
            e.stopPropagation();

            this.focus();
            SUNEDITOR.plugin.horizontalRules.appendHr.call(this, 'black', '1px', e.target.getAttribute('data-value'));
            this.subOff();
        }
    }
})();