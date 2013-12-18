<?php
/*
Copyright (C) 2011  Alexander Zagniotov

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

if ( !function_exists('cgmp_enqueue_head_scripts') ):
        function cgmp_enqueue_head_scripts()  {
				wp_enqueue_script( array ( 'jquery' ) );
        }
endif;


if ( !function_exists('cgmp_google_map_admin_add_style') ):
        function cgmp_google_map_admin_add_style()  {
       			wp_enqueue_style('comprehensive-google-map-style', CGMP_PLUGIN_CSS . '/cgmp.admin.css', false, CGMP_VERSION, "screen");
        }
endif;



if ( !function_exists('cgmp_google_map_admin_add_script') ):
		function cgmp_google_map_admin_add_script()  {

				$whitelist = array('localhost', '127.0.0.1');

              	wp_enqueue_script('cgmp-jquery-tools-tooltip', CGMP_PLUGIN_JS .'/jquery.tools.tooltip.min.js', array('jquery'), '1.2.5.a', true);
				$minified = ".min";
				if (in_array($_SERVER['HTTP_HOST'], $whitelist)) {
					$minified = "";
				}
				wp_enqueue_script('cgmp-jquery-tokeninput', CGMP_PLUGIN_JS. '/cgmp.tokeninput'.$minified.'.js', array('jquery'), CGMP_VERSION, true);
				wp_enqueue_script('comprehensive-google-map-plugin', CGMP_PLUGIN_JS. '/cgmp.admin'.$minified.'.js', array('jquery'), CGMP_VERSION, true);
		}
endif;


if ( !function_exists('cgmp_google_map_tab_script') ):
    	function cgmp_google_map_tab_script()  {
             	wp_enqueue_script('cgmp-jquery-tools-tabs', CGMP_PLUGIN_JS .'/jquery.tools.tabs.min.js', array('jquery'), '1.2.5', true);
        }
endif;


if ( !function_exists('cgmp_google_map_register_scripts') ):
		function cgmp_google_map_register_scripts()  {
			$whitelist = array('localhost', '127.0.0.1');
			$minified = ".min";
			if (in_array($_SERVER['HTTP_HOST'], $whitelist)) {
				$minified = "";
			}
			wp_register_script('cgmp-google-map-orchestrator-framework', CGMP_PLUGIN_JS. '/cgmp.framework'.$minified.'.js', array(), CGMP_VERSION, true);

			$api = CGMP_GOOGLE_API_URL;
			if (is_ssl()) {
				$api = CGMP_GOOGLE_API_URL_SSL;
			}
			wp_register_script('cgmp-google-map-jsapi', $api, array(), false, true);
		}
endif;


if ( !function_exists('cgmp_google_map_init_global_admin_html_object') ):
		function cgmp_google_map_init_global_admin_html_object()  {

			if (is_admin()) {
				echo "<object id='global-data-placeholder' class='cgmp-data-placeholder'>".PHP_EOL;
				echo "    <param id='sep' name='sep' value='".CGMP_SEP."' />".PHP_EOL;
                echo "    <param id='version' name='version' value='".CGMP_VERSION."' />".PHP_EOL;
                $persisted_shortcodes_json = get_option(CGMP_PERSISTED_SHORTCODES);
                if (isset($persisted_shortcodes_json) && trim($persisted_shortcodes_json) != "" && is_array(json_decode($persisted_shortcodes_json, true))) {
                    echo "    <param id='shortcodes' name='shortcodes' value='".$persisted_shortcodes_json."' />".PHP_EOL;
                } else {
                    echo "    <param id='shortcodes' name='shortcodes' value='".json_encode(array())."' />".PHP_EOL;
                }
                echo "    <param id='assets' name='assets' value='".CGMP_PLUGIN_ASSETS_URI."' />".PHP_EOL;
				echo "    <param id='customMarkersUri' name='customMarkersUri' value='".CGMP_PLUGIN_IMAGES."/markers/' />".PHP_EOL;
				echo "    <param id='defaultLocationText' name='defaultLocationText' value='Enter marker destination address or latitude,longitude here (required)' />".PHP_EOL;
				echo "    <param id='defaultBubbleText' name='defaultBubbleText' value='Enter marker info bubble text here (optional)' />".PHP_EOL;
				echo "</object> ".PHP_EOL;
			}
		}
endif;

if ( !function_exists('cgmp_generate_global_options') ):
    function cgmp_generate_global_options()  {

        $tokens_with_values = array();
        //This one gets alerted in native browser alert
        $tokens_with_values['LABEL_BAD_ADDRESSES'] = __('<b>ATTENTION</b>! (by Comprehensive Google Map Plugin)<br /><br />Google found the following address(es) as NON-geographic and could not find them:<br /><br />[REPLACE]<br />Consider revising the address(es). Did you make a mistake when creating marker locations or did not provide a full geo-address? Alternatively use Google web to validate the address(es)',CGMP_NAME);
        $tokens_with_values['LABEL_MISSING_MARKERS'] = __('<b>ATTENTION</b>! (by Comprehensive Google Map Plugin)<br /><br />Dear blog/website owner,<br />You did not specify any marker locations for the Google map! Please check the following when adding marker locations:<br /><b>[a]</b> In the shortcode builder, did you add location(s) and clicked the Add button before generating shortcode?<br /><b>[b]</b> In the widget, did you add location(s) and clicked Add button before clicking Save?<br /><br />Please revisit and reconfigure your widget or shortcode configuration. The map requires at least one marker location to be added..',CGMP_NAME);
        $tokens_with_values['LABEL_KML'] = __('<b>ATTENTION</b>! (by Comprehensive Google Map Plugin)<br /><br />Dear blog/website owner,<br />Google returned the following error when trying to load KML file:<br /><br />[MSG] ([STATUS])',CGMP_NAME);
        $tokens_with_values['LABEL_DOCINVALID_KML'] = __('The KML file is not a valid KML, KMZ or GeoRSS document.',CGMP_NAME);
        $tokens_with_values['LABEL_FETCHERROR_KML'] = __('The KML file could not be fetched.',CGMP_NAME);
        $tokens_with_values['LABEL_LIMITS_KML'] = __('The KML file exceeds the feature limits of KmlLayer.',CGMP_NAME);
        $tokens_with_values['LABEL_NOTFOUND_KML'] = __('The KML file could not be found. Most likely it is an invalid URL, or the document is not publicly available.',CGMP_NAME);
        $tokens_with_values['LABEL_REQUESTINVALID_KML'] = __('The KmlLayer is invalid.',CGMP_NAME);
        $tokens_with_values['LABEL_TIMEDOUT_KML'] = __('The KML file could not be loaded within a reasonable amount of time.',CGMP_NAME);
        $tokens_with_values['LABEL_TOOLARGE_KML'] = __('The KML file exceeds the file size limits of KmlLayer.',CGMP_NAME);
        $tokens_with_values['LABEL_UNKNOWN_KML'] = __('The KML file failed to load for an unknown reason.',CGMP_NAME);
        $tokens_with_values['LABEL_GOOGLE_APIV2'] = __('<b>ATTENTION</b>! (by Comprehensive Google Map Plugin)<br /><br />Dear blog/website owner,<br />It looks like your webpage has reference to the older Google API v2, in addition to the API v3 used by Comprehensive Google Map! An example of plugin using the older API v2, can be jquery.gmap plugin.<br /><br />Please disable conflicting plugin(s). In the meanwhile, map generation is aborted!',CGMP_NAME);
        $tokens_with_values['LABEL_NO_GOOGLE'] = __('<b>ATTENTION</b>!(by Comprehensive Google Map Plugin)<br /><br />Dear blog/website owner,<br />It looks like Google map API could not be reached. Map generation was aborted!<br /><br />Please check that Google API script was loaded in the HTML source of your web page',CGMP_NAME);

        $tokens_with_values = array_map('cgmp_escape_json',$tokens_with_values);
        $global_error_messages_json_template = cgmp_render_template_with_values($tokens_with_values, CGMP_HTML_TEMPLATE_GLOBAL_ERROR_MESSAGES);

        $tokens_with_values = array();
        $tokens_with_values['LABEL_STREETVIEW'] = __('Street View',CGMP_NAME);
        $tokens_with_values['LABEL_ADDRESS'] = __('Address',CGMP_NAME);
        $tokens_with_values['LABEL_DIRECTIONS'] = __('Directions',CGMP_NAME);
        $tokens_with_values['LABEL_TOHERE'] = __('To here',CGMP_NAME);
        $tokens_with_values['LABEL_FROMHERE'] = __('From here',CGMP_NAME);

        $tokens_with_values = array_map('cgmp_escape_json',$tokens_with_values);
        $info_bubble_translated_template = cgmp_render_template_with_values($tokens_with_values, CGMP_HTML_TEMPLATE_INFO_BUBBLE);

        global $cgmp_global_map_language;
        $cgmp_global_map_language = (isset($cgmp_global_map_language) && $cgmp_global_map_language != '') ? $cgmp_global_map_language : "en";

        $errorArray = json_decode($global_error_messages_json_template, true);
        $translationArray = json_decode($info_bubble_translated_template, true);

        echo "<script type='text/javascript'>".PHP_EOL;
        echo "  // Used by Comprehensive Google Map plugin v".CGMP_VERSION.PHP_EOL;
        echo "  var CGMPGlobal = {".PHP_EOL;
        echo "      ajaxurl: \"".admin_url('admin-ajax.php')."\",".PHP_EOL;
        echo "      noBubbleDescriptionProvided: \"".CGMP_NO_BUBBLE_DESC."\",".PHP_EOL;
        echo "      geoValidationClientRevalidate: \"".CGMP_GEO_VALIDATION_CLIENT_REVALIDATE."\",".PHP_EOL;
        echo "      cssHref: \"".CGMP_PLUGIN_URI."style.css?ver=".CGMP_VERSION."\",".PHP_EOL;
        echo "      language: \"".$cgmp_global_map_language."\",".PHP_EOL;
        echo "      customMarkersUri: \"".CGMP_PLUGIN_IMAGES."/markers/\",".PHP_EOL;
        foreach($errorArray as $name => $value) {
            echo "      $name: \"".$value."\",".PHP_EOL;
        }
        foreach($translationArray as $name => $value) {
            echo "      $name: \"".$value."\",".PHP_EOL;
        }
        echo "      sep: \"".CGMP_SEP."\"".PHP_EOL;
        echo "  }".PHP_EOL;
        echo "</script>".PHP_EOL;
    }
endif;

if ( !function_exists('cgmp_escape_json') ):
function cgmp_escape_json( $encode ) {
    return str_replace( array("'",'"','&') , array('\u0027','\u0022','\u0026') , $encode );
}
endif;

?>
