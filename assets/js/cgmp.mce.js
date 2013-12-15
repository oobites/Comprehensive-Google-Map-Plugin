(function () {
    tinymce.create('tinymce.plugins.shortcode', {

        createControl: function (n, cm) {
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
                            m.add({title : this.title, icon: 'cgmp-mce-split-button-menu-item-icon'});
                        });
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

    jQuery(document).ready(function () {
        jQuery(document).on("click", "div#menu_content_content_shortcode_menu span.mce_cgmp-mce-split-button-menu-item-icon", function(event) {

            var clickedIcon = jQuery(this);
            var shortcodeTitle = jQuery(this).next().text();
            jQuery.post(ajaxurl, {action: 'cgmp_mce_ajax_action', title: shortcodeTitle}, function (response) {
                if (response === "OK") {
                    jQuery(clickedIcon).closest("tr").remove();
                    alert("Shortcode deleted!");
                }
            });

            return false;
        });

        jQuery(document).on("click", "div#menu_content_content_shortcode_menu span.mceText", function(event) {
            var menuTitle = jQuery(this).text();
            var shortcodesJson = jQuery.parseJSON(CGMPGlobal.shortcodes);
            jQuery.each(shortcodesJson, function () {
                if (this.title === menuTitle) {
                    var code = this.code.replace(new RegExp("\\\\\"", "g"), "\""); // replace escaped quote and escaping slash with just quote
                    tinymce.activeEditor.setContent(tinymce.activeEditor.getContent() + code);
                }
            });
            return false;
        });
    });
})();


