/*
 * wysiwyg web editor
 *
 * suneditor.js
 * Copyright 2017 JiHong Lee.
 * MIT license.
 */
(function () {
    SUNEDITOR.plugin.hiliteColor = {
        add: function (_this, targetElement) {
            /** set submenu */
            var listDiv = eval(this.setSubmenu());

            /** add event listeners */
            listDiv.getElementsByTagName('UL')[0].addEventListener('click', this.colorPick.bind(_this));

            /** append html */
            targetElement.parentNode.appendChild(listDiv);
        },

        setSubmenu: function () {
            var listDiv = document.createElement('DIV');
            listDiv.className = 'layer_editor layer_color';
            listDiv.style.display = 'none';

            var colorList = ['#1e9af9','#00b8c6','#6cce02','#ff9702','#ff0000','#ff00dd','#6600ff','#cce9ff','#fcfd4c','#ffffff','#dfdede','#8c8c8c','#000000','#222222'];

            var list = '<div class="inner_layer">'+
                       '   <div class="pallet_bgcolor pallet_text">'+
                       '       <ul class="list_color list_bgcolor">';
            for(var i=0; i<colorList.length; i++) {
                var color = colorList[i];
                list += '<li>' +
                        '   <button type="button" class="btn_edit'+(/ffffff/.test(color)? ' color_white': '')+'" data-value="'+color+'" style="background-color:'+color+';">'+color+'' +
                        '       <span class="bg_check"></span>' +
                        '       <span class="bg_btnframe"></span>' +
                        '   </button>' +
                        '</li>';
            }
            list += '       </ul>'+
                    '   </div>'+
                    '</div>';

            listDiv.innerHTML = list;

            return listDiv;
        },

        colorPick : function (e) {
            if(!/btn_edit/.test(e.target.className)) {
                return false;
            }

            e.preventDefault();
            e.stopPropagation();

            this.focus();
            this.execCommand('hiliteColor', false, e.target.getAttribute('data-value'));
            this.subOff();
        }
    }
})();