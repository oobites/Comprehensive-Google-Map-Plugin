(function () {
    tinymce.create('tinymce.plugins.shortcode', {

        createControl: function (n, cm) {
            console.log(n);
            switch (n) {
                case 'shortcode':
                    var csm = cm.createSplitButton( 'shortcode', {
                        title	: "Load saved shortcodes",
                        image: CGMPGlobal.assets + '/css/images/google_map.png',
                        onclick: function () {
                            jQuery.post(ajaxurl, {action: 'cgmp_mce_ajax_action'}, function (response) {
                                //alert(response);
                            });
                        }
                    });

                    csm.onRenderMenu.add( function(c, m) {
                        m.add({title: 'Load saved shortcodes', 'class': 'mceMenuItemTitle'}).setDisabled(1);
                        var shortcodesJson = jQuery.parseJSON(CGMPGlobal.shortcodes);
                        jQuery.each(shortcodesJson, function () {
                            m.add({title : this.title, icon: 'cgmp-mce-split-button-menu-item-icon', onclick : menuItemClickHandler(this.code)});
                        });

                        function menuItemClickHandler(code) {
                            return function() {
                                code = code.replace(new RegExp("\\\\\"", "g"), "\""); // replace escaped quote and escaping slash with just quote
                                tinymce.activeEditor.setContent(tinymce.activeEditor.getContent() + code);
                            }
                        }
                    });

                    return csm;
            }
            return null;
        },
        getInfo : function() {
            return {
                longname : 'Comprehensive Google Map Plugin',
                author : 'Alexander Zagniotov',
                authorurl : 'http://wordpress.org/plugins/comprehensive-google-map-plugin/',
                infourl : 'http://wordpress.org/plugins/comprehensive-google-map-plugin/',
                version : CGMPGlobal.version
            };
        }
    });
    tinymce.PluginManager.add('shortcode', tinymce.plugins.shortcode);
})();

