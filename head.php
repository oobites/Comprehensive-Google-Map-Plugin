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

if ( !function_exists('cgmp_google_map_admin_add_style') ):
        function cgmp_google_map_admin_add_style()  {
       			wp_enqueue_style('comprehensive-google-map-style', CGMP_PLUGIN_CSS . '/cgmp.admin.css', false, CGMP_VERSION, "screen");
        }
endif;


if ( !function_exists('cgmp_google_map_admin_add_script') ):
		function cgmp_google_map_admin_add_script()  {

				$whitelist = array('localhost', '127.0.0.1');

              	wp_enqueue_script('cgmp-jquery-tools-tooltip', CGMP_PLUGIN_JS .'/jquery.tools.tooltip.min.js', array('jquery'), '1.2.5.a', true);
				
				if (!in_array($_SERVER['HTTP_HOST'], $whitelist)) {
 					wp_enqueue_script('cgmp-jquery-tokeninput', CGMP_PLUGIN_JS. '/cgmp.tokeninput.min.js', array('jquery'), CGMP_VERSION, true);
				} else {
					wp_enqueue_script('cgmp-jquery-tokeninput', CGMP_PLUGIN_JS. '/cgmp.tokeninput.js', array('jquery'), CGMP_VERSION, true);
				}

				if (!in_array($_SERVER['HTTP_HOST'], $whitelist)) {
					wp_enqueue_script('comprehensive-google-map-plugin', CGMP_PLUGIN_JS. '/cgmp.admin.min.js', array('jquery'), CGMP_VERSION, true);
				} else {
					wp_enqueue_script('comprehensive-google-map-plugin', CGMP_PLUGIN_JS. '/cgmp.admin.js', array('jquery'), CGMP_VERSION, true);
				}
		}
endif;


if ( !function_exists('cgmp_google_map_tab_script') ):
    	function cgmp_google_map_tab_script()  {
             	wp_enqueue_script('cgmp-jquery-tools-tabs', CGMP_PLUGIN_JS .'/jquery.tools.tabs.min.js', array('jquery'), '1.2.5', true);
        }
endif;


if ( !function_exists('cgmp_google_map_init_scripts') ):
		function cgmp_google_map_init_scripts()  {

			if (!is_admin()) {
				wp_enqueue_style('cgmp-google-map-styles', CGMP_PLUGIN_URI . 'style.css', false, CGMP_VERSION, "screen");
				$whitelist = array('localhost', '127.0.0.1');
				if (!in_array($_SERVER['HTTP_HOST'], $whitelist)) {
					wp_enqueue_script('cgmp-google-map-wrapper-framework-final', CGMP_PLUGIN_JS. '/cgmp.framework.min.js', array('jquery'), CGMP_VERSION, true);
				} else {
					wp_enqueue_script('cgmp-google-map-wrapper-framework-final', CGMP_PLUGIN_JS. '/cgmp.framework.js', array('jquery'), CGMP_VERSION, true);
				}
			}
		}
endif;


if ( !function_exists('cgmp_google_map_init_global_admin_html_object') ):
		function cgmp_google_map_init_global_admin_html_object()  {

			if (is_admin()) {
				echo "<object id='global-data-placeholder'>".PHP_EOL;
				echo "    <param id='sep' name='sep' value='".CGMP_SEP."' />".PHP_EOL;
				echo "    <param id='customMarkersUri' name='customMarkersUri' value='".CGMP_PLUGIN_IMAGES."/markers/' />".PHP_EOL;
				echo "</object> ".PHP_EOL;
			}
		}
endif;


if ( !function_exists('cgmp_google_map_init_global_html_object') ):
		function cgmp_google_map_init_global_html_object()  {

			if (!is_admin()) {
				$global_error_messages_json_string = file_get_contents(CGMP_PLUGIN_DATA_DIR."/".CGMP_JSON_DATA_HTML_GLOBAL_ERROR_MESSAGES);
				echo "<object id='global-data-placeholder'>".PHP_EOL;
				echo "    <param id='sep' name='sep' value='".CGMP_SEP."' />".PHP_EOL;
				echo "    <param id='customMarkersUri' name='customMarkersUri' value='".CGMP_PLUGIN_IMAGES."/markers/' />".PHP_EOL;
				echo "    <param id='errors' name='errors' value='".$global_error_messages_json_string."' />".PHP_EOL;
				echo "</object> ".PHP_EOL;
			}
		}
endif;


?>
