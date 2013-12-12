/*
 Copyright (C) 2011 - 2013 Alexander Zagniotov

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
//http://stackoverflow.com/questions/4845762/onload-handler-for-script-tag-in-internet-explorer
(function () {
    if (typeof jQuery === "undefined" || jQuery == null) {
        var done = false;
        var head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = "http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js";

        script.onload = script.onreadystatechange = function () {
            if (!done && (!this.readyState || /loaded|complete/.test(script.readyState))) {
                done = true;

                var jQueryObj = jQuery.noConflict();
                jQueryLoadCallback(jQueryObj);
                // Handle memory leak in IE
                script.onload = script.onreadystatechange = null;
                if (head && script.parentNode) {
                    head.removeChild(script);
                }
                script = undefined;
            }
        };
        // Use insertBefore instead of appendChild  to circumvent an IE6 bug - die IE6, just die! A.Z.
        // head.insertBefore( script, head.firstChild );
        head.appendChild(script);
    } else {
        jQueryLoadCallback();
    }

    function jQueryLoadCallback() {
        var jQueryObj = (typeof arguments[0] === "undefined" || arguments[0] == null || !arguments[0]) ? jQuery : arguments[0];

        (function ($) {

            var parseJson = function (jsonString) {
            }
            var versionMajor = parseFloat($.fn.jquery.split(".")[0]);
            var versionMinor = parseFloat($.fn.jquery.split(".")[1]);
            if (versionMajor >= 1 && versionMajor < 2 && versionMinor >= 4) {
                parseJson = $.parseJSON;
            } else if (window.JSON && window.JSON.parse) {
                parseJson = window.JSON.parse;
            } else {
                Logger.fatal("Using parseJson stub..");
            }

            var CGMPGlobal = {};
            var GoogleMapOrchestrator = (function () {

                var builder = {};
                var googleMap = {};
                var initMap = function initMap(map, bubbleAutoPan, zoom, mapType) {
                    googleMap = map;

                    var mapTypeIds = [];
                    for (var type in google.maps.MapTypeId) {
                        mapTypeIds.push(google.maps.MapTypeId[type]);
                    }

                    if (mapType == "OSM") {
                        mapTypeIds.push(mapType);
                        googleMap.mapTypes.set(mapType, new google.maps.ImageMapType({
                            getTileUrl: function (coord, zoom) {
                                return "http://tile.openstreetmap.org/" + zoom + "/" + coord.x + "/" + coord.y + ".png";
                            },
                            tileSize: new google.maps.Size(256, 256),
                            name: "OpenStreet",
                            maxZoom: 20
                        }));
                    } else if (mapType == "roadmap".toUpperCase()) {
                        mapType = google.maps.MapTypeId.ROADMAP;
                    } else if (mapType == "satellite".toUpperCase()) {
                        mapType = google.maps.MapTypeId.SATELLITE;
                    } else if (mapType == "hybrid".toUpperCase()) {
                        mapType = google.maps.MapTypeId.HYBRID;
                    } else if (mapType == "terrain".toUpperCase()) {
                        mapType = google.maps.MapTypeId.TERRAIN;
                    }

                    googleMap.setOptions({
                        zoom: zoom,
                        mapTypeId: mapType,
                        mapTypeControlOptions: {
                            mapTypeIds: mapTypeIds
                        }
                    });
                }

                var setMapControls = function setMapControls(mapControlOptions) {
                    googleMap.setOptions(mapControlOptions);
                }

                return {
                    initMap: initMap,
                    setMapControls: setMapControls
                }
            })();


            var LayerBuilder = (function () {

                var googleMap = {};

                var init = function init(map) {
                    googleMap = map;
                }

                var buildTrafficLayer = function buildTrafficLayer() {
                    var trafficLayer = new google.maps.TrafficLayer();
                    trafficLayer.setMap(googleMap);
                }

                var buildBikeLayer = function buildBikeLayer() {
                    var bikeLayer = new google.maps.BicyclingLayer();
                    bikeLayer.setMap(googleMap);
                }

                var buildPanoramioLayer = function buildPanoramioLayer(userId) {
                    if (typeof google.maps.panoramio === "undefined" || !google.maps.panoramio || google.maps.panoramio == null) {
                        Logger.error("We cannot access Panoramio library. Aborting..");
                        return false;
                    }
                    var panoramioLayer = new google.maps.panoramio.PanoramioLayer();
                    if (panoramioLayer) {
                        if (userId != null && userId != "") {
                            panoramioLayer.setUserId(userId);
                        }
                        panoramioLayer.setMap(googleMap);
                    } else {
                        Logger.error("Could not instantiate Panoramio object. Aborting..");
                    }
                }

                var buildKmlLayer = function buildKmlLayer(url) {
                    if (url.toLowerCase().indexOf("http") < 0) {
                        Logger.error("KML URL must start with HTTP(S). Aborting..");
                        return false;
                    }

                    var kmlLayer = new google.maps.KmlLayer(url /*, {preserveViewport: true}*/);
                    google.maps.event.addListener(kmlLayer, "status_changed", function () {
                        kmlLayerStatusEventCallback(kmlLayer);
                    });
                    google.maps.event.addListener(kmlLayer, 'defaultviewport_changed', function () {
                        //var bounds = kmlLayer.getDefaultViewport();
                        //googleMap.setCenter(bounds.getCenter());
                    });

                    kmlLayer.setMap(googleMap);
                }

                function kmlLayerStatusEventCallback(kmlLayer) {
                    var kmlStatus = kmlLayer.getStatus();
                    if (kmlStatus == google.maps.KmlLayerStatus.OK) {
                        //Hmmm...
                    } else {
                        var msg = '';
                        switch (kmlStatus) {

                            case google.maps.KmlLayerStatus.DOCUMENT_NOT_FOUND:
                                msg = CGMPGlobal.errors.kmlNotFound;
                                break;
                            case google.maps.KmlLayerStatus.DOCUMENT_TOO_LARGE:
                                msg = CGMPGlobal.errors.kmlTooLarge;
                                break;
                            case google.maps.KmlLayerStatus.FETCH_ERROR:
                                msg = CGMPGlobal.errors.kmlFetchError;
                                break;
                            case google.maps.KmlLayerStatus.INVALID_DOCUMENT:
                                msg = CGMPGlobal.errors.kmlDocInvalid;
                                break;
                            case google.maps.KmlLayerStatus.INVALID_REQUEST:
                                msg = CGMPGlobal.errors.kmlRequestInvalid;
                                break;
                            case google.maps.KmlLayerStatus.LIMITS_EXCEEDED:
                                msg = CGMPGlobal.errors.kmlLimits;
                                break;
                            case google.maps.KmlLayerStatus.TIMED_OUT:
                                msg = CGMPGlobal.errors.kmlTimedOut;
                                break;
                            case google.maps.KmlLayerStatus.UNKNOWN:
                                msg = CGMPGlobal.errors.kmlUnknown;
                                break;
                        }
                        if (msg != '') {
                            var error = CGMPGlobal.errors.kml.replace("[MSG]", msg);
                            error = error.replace("[STATUS]", kmlStatus);
                            Errors.alertError(error);
                            Logger.error("Google returned KML error: " + msg + " (" + kmlStatus + ")");
                            Logger.error("KML file: " + kmlLayer.getUrl());
                        }
                    }
                }

                return {
                    init: init,
                    buildKmlLayer: buildKmlLayer,
                    buildTrafficLayer: buildTrafficLayer,
                    buildBikeLayer: buildBikeLayer,
                    buildPanoramioLayer: buildPanoramioLayer
                }
            })();


            var MarkerBuilder = function () {
                var markers, storedAddresses, badAddresses, defaultUnits, wasBuildAddressMarkersCalled, timeout, directionControlsBinded, googleMap, csvString, bubbleAutoPan, originalExtendedBounds, originalMapCenter, updatedZoom, mapDivId, geocoder, bounds, infowindow, streetViewService, directionsRenderer, directionsService;
                var geolocationMarker = null;
                var init = function init(map, autoPan, units) {
                    googleMap = map;
                    mapDivId = googleMap.getDiv().id;
                    bubbleAutoPan = autoPan;
                    defaultUnits = units;
                    google.maps.event.addListener(googleMap, 'click', function () {
                        resetMap();
                    });

                    markers = [];
                    badAddresses = [];
                    storedAddresses = [];

                    updatedZoom = 5;

                    timeout = null;
                    csvString = null;
                    originalMapCenter = null;
                    originalExtendedBounds = null;

                    directionControlsBinded = false;
                    wasBuildAddressMarkersCalled = false;

                    geocoder = new google.maps.Geocoder();
                    bounds = new google.maps.LatLngBounds();
                    infowindow = new google.maps.InfoWindow();
                    streetViewService = new google.maps.StreetViewService();
                    directionsService = new google.maps.DirectionsService();

                    rendererOptions = {
                        draggable: true
                    };
                    directionsRenderer = new google.maps.DirectionsRenderer(rendererOptions);
                    directionsRenderer.setPanel(document.getElementById('rendered-directions-placeholder-' + mapDivId));
                }

                var setGeoLocationIfEnabled = function setGeoLocationIfEnabled(enableGeoLocation) {
                    if (enableGeoLocation === "true") {
                        geolocationMarker = new GeolocationMarker();

                        google.maps.event.addListenerOnce(geolocationMarker, 'position_changed', function () {
                            googleMap.setCenter(this.getPosition());
                            googleMap.fitBounds(this.getBounds());
                        });

                        google.maps.event.addListener(geolocationMarker, 'geolocation_error', function (e) {
                            alert('There was an error creating Geolocation marker: ' + e.message + "\n\nProceeding with normal map generation..");
                            Logger.error('There was an error obtaining your position. Message: ' + e.message);
                            geolocationMarker = null; // Makes sure that the map is rendered when there was a problem with Geo marker
                        });
                        geolocationMarker.setPositionOptions({enableHighAccuracy: true, timeout: 6000, maximumAge: 0});
                        geolocationMarker.setMap(googleMap);
                    }
                }

                var isBuildAddressMarkersCalled = function isBuildAddressMarkersCalled() {
                    return wasBuildAddressMarkersCalled;
                }

                var buildAddressMarkers = function buildAddressMarkers(markerLocations, isGeoMashap, isBubbleContainsPostLink) {

                    wasBuildAddressMarkersCalled = true;
                    csvString = Utils.trim(markerLocations);
                    csvString = Utils.searchReplace(csvString, "'", "");

                    if (isGeoMashap === "true") {
                        var json = parseJson(csvString);
                        if (isBubbleContainsPostLink === "true") {
                            createGoogleMarkersFromGeomashupJson(json, true);
                        } else if (isBubbleContainsPostLink === "false") {
                            createGoogleMarkersFromGeomashupJson(json, false);
                        }
                    } else if (isGeoMashap == null || isGeoMashap === "false") {
                        createGoogleMarkersFromCsvAddressData(csvString, '', '', '', false, false);
                    }
                    setBounds();
                }

                function createGoogleMarkersFromGeomashupJson(json, infoBubbleContainPostLink) {
                    var index = 1;
                    $.each(json, function () {
                        if (this.excerpt == null) {
                            this.excerpt = '';
                        }
                        if (typeof this.validated_address_csv_data === "undefined" || this.validated_address_csv_data === "") {
                            Logger.error("Validated address on page: " + this.permalink + " returned empty, perhaps OVER_QUERY_LIMIT when validating on the server..");
                        }

                        createGoogleMarkersFromCsvAddressData(this.validated_address_csv_data, this.title, this.permalink, this.excerpt, infoBubbleContainPostLink, true);
                        index++;
                    });
                    Logger.info("Have " + (index - 1) + " destinations for marker Geo mashup..");
                }

                function createGoogleMarkersFromCsvAddressData(csvString, postTitle, postLink, postExcerpt, infoBubbleContainPostLink, geoMashup) {
                    if (typeof csvString === "undefined" || csvString === "") {
                        Logger.fatal("Not parsing empty validated address csv data.. Skipping");
                    }

                    var locations = csvString.split("|");
                    Logger.info("CGMP CSV: " + locations);
                    for (var i = 0; i < locations.length; i++) {
                        var target = locations[i];
                        if (target != null && target != "") {
                            // Will always be of size 4
                            var targetArr = target.split(CGMPGlobal.sep);
                            var userInputAddress = targetArr[0];
                            var markerIcon = targetArr[1];
                            var markerBubbleDescription = targetArr[2];
                            var rawCoordinates = targetArr[3];

                            if (markerBubbleDescription.indexOf(CGMPGlobal.noBubbleDescriptionProvided) != -1) {
                                markerBubbleDescription = '';
                            }

                            var element = {
                                address: userInputAddress,
                                animation: google.maps.Animation.DROP,
                                zIndex: (i + 1),
                                markerIcon: markerIcon,
                                customBubbleText: markerBubbleDescription,
                                markerHoverText: markerBubbleDescription + " (" + userInputAddress + ")",
                                postTitle: postTitle,
                                postLink: postLink,
                                postExcerpt: postExcerpt,
                                infoBubbleContainPostLink: infoBubbleContainPostLink,
                                geoMashup: geoMashup
                            };

                            var latlngArr = [];
                            if (rawCoordinates.indexOf(",") != -1) {
                                latlngArr = rawCoordinates.split(",");
                            } else if (rawCoordinates.indexOf(";") != -1) {
                                latlngArr = rawCoordinates.split(";");
                            }
                            latlngArr[0] = Utils.trim(latlngArr[0]);
                            latlngArr[1] = Utils.trim(latlngArr[1]);

                            if (latlngArr[0] === "" || latlngArr[1] === "") {
                                Logger.warn("Lat or Long are empty string");
                                return false;
                            }

                            var latLngPoint = new google.maps.LatLng(parseFloat(latlngArr[0]).toFixed(8), parseFloat(latlngArr[1]).toFixed(8));
                            Logger.info("Have marker to instrument for: " + userInputAddress + " for location: " + latLngPoint);

                            instrumentMarker(latLngPoint, element);
                        }
                    }
                }

                function instrumentMarker(point, element) {
                    var marker = new google.maps.Marker({
                        position: point,
                        title: element.markerHoverText,
                        content: element.address,
                        zIndex: (element.zIndex + 1000),
                        map: googleMap
                    });
                    if (marker) {
                        Logger.info("Marker instrumented for: " + element.address + " for location: " + point);
                        if (element.markerIcon) {
                            var markerIcon = element.markerIcon;
                            if (typeof markerIcon == "undefined" || markerIcon === "undefined") {
                                markerIcon = '1-default.png';
                            }
                            marker.setIcon(CGMPGlobal.customMarkersUri + markerIcon);

                            var shadow = null;
                            var defaultMarkers = ['1-default.png', '2-default.png'];
                            var defaultPins = ['4-default.png', '5-default.png', '6-default.png', '7-default.png'];

                            if ($.inArray(markerIcon, defaultMarkers) != -1) {
                                var url = CGMPGlobal.customMarkersUri + "msmarker.shadow.png";
                                shadow = buildMarkerImage(url, 59, 32, 0, 0, 16, 33);
                            } else if ($.inArray(markerIcon, defaultPins) != -1) {
                                var url = CGMPGlobal.customMarkersUri + "msmarker.shadow.png";
                                shadow = buildMarkerImage(url, 59, 32, 0, 0, 21, 34);
                            } else if (markerIcon.indexOf('3-default') != -1) {
                                var url = CGMPGlobal.customMarkersUri + "beachflag_shadow.png";
                                shadow = buildMarkerImage(url, 37, 32, 0, 0, 10, 33);
                            } else {
                                shadow = buildMarkerImage(CGMPGlobal.customMarkersUri + "shadow.png", 68, 37, 0, 0, 32, 38);
                            }

                            marker.setShadow(shadow);
                        }

                        attachEventlistener(marker, element);
                        if (!directionControlsBinded) {
                            bindDirectionControlsToEvents();
                            directionControlsBinded = true;
                        }

                        markers.push(marker);
                    }
                }

                function buildMarkerImage(url, sizeX, sizeY, pointAX, pointAY, pointBX, pointBY) {
                    return new google.maps.MarkerImage(url, new google.maps.Size(sizeX, sizeY), new google.maps.Point(pointAX, pointAY), new google.maps.Point(pointBX, pointBY));
                }

                function setBounds() {
                    var fitToBounds = false;
                    var isGeolocationMarker = geolocationMarker == null ? false : true;
                    if (markers.length > 1) {
                        $.each(markers, function (index, marker) {
                            if (!bounds.contains(marker.position)) {
                                bounds.extend(marker.position);
                            }
                        });
                        fitToBounds = true;
                    } else if (markers.length == 1) {
                        if (isGeolocationMarker) {
                            bounds.extend(markers[0].position);
                            fitToBounds = true;
                        } else {
                            googleMap.setCenter(markers[0].position);
                            updatedZoom = googleMap.getZoom();
                            originalMapCenter = googleMap.getCenter();
                        }
                    }

                    if (fitToBounds) {
                        if (isGeolocationMarker) {
                            if (geolocationMarker.getPosition() != null) {
                                Logger.info("Extended bounds with Geo marker position: " + geolocationMarker.getPosition());
                                bounds.extend(geolocationMarker.getPosition());
                            }
                        }
                        originalExtendedBounds = bounds;
                        if (bounds != null) {
                            googleMap.fitBounds(bounds);
                        }
                    }
                }

                function resetMap() {
                    if (originalExtendedBounds != null) {
                        if (googleMap.getCenter() != originalExtendedBounds.getCenter()) {
                            Logger.info("Panning map back to its original bounds center: " + originalExtendedBounds.getCenter());
                            googleMap.fitBounds(originalExtendedBounds);
                            googleMap.setCenter(originalExtendedBounds.getCenter());
                        }
                    } else if (originalMapCenter != null) {
                        Logger.info("Panning map back to its original center: " + originalMapCenter  + " and updated zoom: " + updatedZoom);
                        googleMap.setCenter(originalMapCenter);
                        googleMap.setZoom(updatedZoom);
                    }
                }

                function resetDirectionAddressFields(dirDivId) {
                    $(dirDivId + ' input#a_address').val('');
                    $(dirDivId + ' input#b_address').val('');
                    $(dirDivId + ' input#a_address').removeClass('d_error');
                    $(dirDivId + ' input#b_address').removeClass('d_error');
                    $('input#' + mapDivId + '_avoid_hway').prop("checked", false);
                    $('input#' + mapDivId + '_avoid_tolls').prop("checked", false);
                    $('input#' + mapDivId + '_radio_km').prop("checked", false);
                    $('input#' + mapDivId + '_radio_miles').prop("checked", true);
                }

                function attachEventlistener(marker, markersElement) {

                    var localBubbleData = buildBubble(marker.content, markersElement);
                    var dirDivId = 'div#direction-controls-placeholder-' + mapDivId;
                    var targetDiv = $("div#rendered-directions-placeholder-" + mapDivId);

                    google.maps.event.addListener(marker, 'click', function () {

                        resetDirectionAddressFields(dirDivId);

                        $(dirDivId).fadeOut();
                        directionsRenderer.setMap(null);
                        targetDiv.html("");
                        targetDiv.hide();
                        $(dirDivId + ' button#print_sub').hide();

                        validateMarkerStreetViewExists(marker, localBubbleData, dirDivId);
                        attachDirectionControlsEvents(marker, localBubbleData, dirDivId, targetDiv);

                        infowindow.setContent(localBubbleData.bubbleContent);
                        infowindow.setOptions({
                            disableAutoPan: bubbleAutoPan === "true" ? false : true
                        });
                        infowindow.open(googleMap, this);
                    });
                }

                function attachDirectionControlsEvents(marker, localBubbleData, dirDivId, targetDiv) {

                    var parentInfoBubble = 'div#bubble-' + localBubbleData.bubbleHolderId;
                    var addy = marker.content;

                    addy = addy.replace("Lat/Long: ", "");

                    var isGeolocationMarker = geolocationMarker == null ? false : true;
                    var geoMarkerPosition = isGeolocationMarker == false || geolocationMarker.getPosition() == null ? '' : geolocationMarker.getPosition();
                    $(document).on("click", parentInfoBubble + ' a.dirToHereTrigger', function () {
                        var thisId = this.id;
                        if (thisId === 'toHere-' + localBubbleData.bubbleHolderId) {
                            $(dirDivId).fadeIn();
                            $(dirDivId + ' input#a_address').val(geoMarkerPosition);
                            $(dirDivId + ' input#b_address').val(addy);
                            if (defaultUnits === "miles") {
                                $('input#' + mapDivId + '_radio_miles').prop("checked", true);
                                $('input#' + mapDivId + '_radio_km').prop("checked", false);
                            } else if (defaultUnits === "km") {
                                $('input#' + mapDivId + '_radio_km').prop("checked", true);
                                $('input#' + mapDivId + '_radio_miles').prop("checked", false);
                            }
                        }
                    });

                    $(document).on("click", parentInfoBubble + ' a.dirFromHereTrigger', function () {
                        var thisId = this.id;
                        if (thisId === 'fromHere-' + localBubbleData.bubbleHolderId) {
                            $(dirDivId).fadeIn();
                            $(dirDivId + ' input#a_address').val(addy);
                            $(dirDivId + ' input#b_address').val(geoMarkerPosition);

                            if (defaultUnits === "miles") {
                                $('input#' + mapDivId + '_radio_miles').prop("checked", true);
                                $('input#' + mapDivId + '_radio_km').prop("checked", false);
                            } else if (defaultUnits === "km") {
                                $('input#' + mapDivId + '_radio_km').prop("checked", true);
                                $('input#' + mapDivId + '_radio_miles').prop("checked", false);
                            }
                        }
                    });

                    $(document).on("click", dirDivId + ' div.d_close-wrapper', function (event) {

                        resetDirectionAddressFields(dirDivId);

                        $(this).parent().fadeOut();
                        directionsRenderer.setMap(null);
                        targetDiv.html("");
                        targetDiv.hide();
                        $(dirDivId + ' button#print_sub').hide();
                        resetMap();

                        return false;
                    });
                }

                function validateMarkerStreetViewExists(marker, localBubbleData, dirDivId) {

                    streetViewService.getPanoramaByLocation(marker.position, 50, function (streetViewPanoramaData, status) {
                        if (status === google.maps.StreetViewStatus.OK) {
                            // ok
                            $(document).on("click", 'a#trigger-' + localBubbleData.bubbleHolderId, function () {
                                var panoramaOptions = {
                                    navigationControl: true,
                                    enableCloseButton: true,
                                    addressControl: false,
                                    linksControl: true,
                                    scrollwheel: false,
                                    addressControlOptions: {
                                        position: google.maps.ControlPosition.BOTTOM
                                    },
                                    position: marker.position,
                                    pov: {
                                        heading: 165,
                                        pitch: 0,
                                        zoom: 1
                                    }
                                };

                                var pano = new google.maps.StreetViewPanorama(document.getElementById("bubble-" + localBubbleData.bubbleHolderId), panoramaOptions);
                                pano.setVisible(true);

                                google.maps.event.addListener(infowindow, 'closeclick', function () {

                                    resetDirectionAddressFields(dirDivId);
                                    $(dirDivId).fadeOut();

                                    if (pano != null) {
                                        pano.unbind("position");
                                        pano.setVisible(false);
                                    }

                                    pano = null;
                                });

                                google.maps.event.addListener(pano, 'closeclick', function () {
                                    if (pano != null) {
                                        pano.unbind("position");
                                        pano.setVisible(false);
                                        $('div#bubble-' + localBubbleData.bubbleHolderId).css("background", "none");
                                    }

                                    pano = null;
                                });

                            });
                        } else {
                            // no street view available in this range, or some error occurred
                            Logger.warn("There is not street view available for this marker location: " + marker.position + " status: " + status);
                            $(document).on("click", 'a#trigger-' + localBubbleData.bubbleHolderId, function (e) {
                                e.preventDefault();
                            });
                            $('a#trigger-' + localBubbleData.bubbleHolderId).attr("style", "text-decoration: none !important; color: #ddd !important");

                            google.maps.event.addListener(infowindow, 'domready', function () {
                                $('a#trigger-' + localBubbleData.bubbleHolderId).removeAttr("href");
                                $('a#trigger-' + localBubbleData.bubbleHolderId).attr("style", "text-decoration: none !important; color: #ddd !important");
                            });
                        }
                    });
                }


                function bindDirectionControlsToEvents() {

                    var dirDivId = 'div#direction-controls-placeholder-' + mapDivId;
                    var targetDiv = $("div#rendered-directions-placeholder-" + mapDivId);

                    $(document).on("click", dirDivId + ' a#reverse-btn', function (e) {

                        var old_a_addr = $(dirDivId + ' input#a_address').val();
                        var old_b_addr = $(dirDivId + ' input#b_address').val();

                        $(dirDivId + ' input#a_address').val(old_b_addr);
                        $(dirDivId + ' input#b_address').val(old_a_addr);
                        return false;
                    });

                    $(document).on("click", dirDivId + ' a#d_options_show', function () {
                        $(dirDivId + ' a#d_options_hide').show();
                        $(dirDivId + ' a#d_options_show').hide();
                        $(dirDivId + ' div#d_options').show();
                        return false;
                    });

                    $(document).on("click", dirDivId + ' a#d_options_hide', function () {
                        $(dirDivId + ' a#d_options_hide').hide();
                        $(dirDivId + ' a#d_options_show').show();
                        $(dirDivId + ' div#d_options').hide();
                        $('input#' + mapDivId + '_avoid_hway').prop("checked", false);
                        $('input#' + mapDivId + '_avoid_tolls').prop("checked", false);
                        $('input#' + mapDivId + '_radio_km').prop("checked", false);
                        $('input#' + mapDivId + '_radio_miles').prop("checked", true);
                        return false;
                    });

                    $(document).on("click", dirDivId + ' button#d_sub', function () {
                        var old_a_addr = $(dirDivId + ' input#a_address').val();
                        var old_b_addr = $(dirDivId + ' input#b_address').val();
                        var halt = false;
                        if (old_a_addr == null || old_a_addr == '') {
                            $(dirDivId + ' input#a_address').addClass('d_error');
                            halt = true;
                        }

                        if (old_b_addr == null || old_b_addr == '') {
                            $(dirDivId + ' input#b_address').addClass('d_error');
                            halt = true;
                        }

                        if (!halt) {

                            $(dirDivId + ' button#d_sub').prop('disabled', true).html("Please wait..");
                            // Query direction service
                            var travelMode = google.maps.DirectionsTravelMode.DRIVING;
                            if ($(dirDivId + ' a#dir_w_btn').hasClass('selected')) {
                                travelMode = google.maps.DirectionsTravelMode.WALKING;
                            }

                            var is_avoid_hway = $('input#' + mapDivId + '_avoid_hway').is(":checked");
                            var is_avoid_tolls = $('input#' + mapDivId + '_avoid_tolls').is(":checked");
                            var is_miles = $('input#' + mapDivId + '_radio_miles').is(":checked");

                            var request = {
                                origin: old_a_addr,
                                destination: old_b_addr,
                                travelMode: travelMode,
                                provideRouteAlternatives: true
                            };

                            if (is_avoid_hway) {
                                request.avoidHighways = true;
                            }

                            if (is_avoid_tolls) {
                                request.avoidTolls = true;
                            }

                            if (is_miles) {
                                request.unitSystem = google.maps.DirectionsUnitSystem.IMPERIAL;
                            } else {
                                request.unitSystem = google.maps.DirectionsUnitSystem.METRIC;
                            }

                            directionsService.route(request, function (response, status) {

                                if (status == google.maps.DirectionsStatus.OK) {
                                    targetDiv.html("");
                                    targetDiv.show();
                                    directionsRenderer.setMap(googleMap);
                                    directionsRenderer.setDirections(response);
                                    $(dirDivId + ' button#d_sub').removeAttr('disabled').html("Get directions");
                                    $(dirDivId + ' button#print_sub').fadeIn();
                                    infowindow.close();

                                } else {
                                    Logger.error('Could not route directions from "' + old_a_addr + '" to "' + old_b_addr + '", got result from Google: ' + status);
                                    targetDiv.html("<span style='font-size: 12px; font-weight: bold; color: red'>Could not route directions from<br />'" + old_a_addr + "' to<br />'" + old_b_addr + "'<br />Got result from Google: [" + status + "]</span>");

                                    $(dirDivId + ' button#print_sub').hide();
                                    $(dirDivId + ' button#d_sub').removeAttr('disabled').html("Get directions");
                                }
                            });
                        }
                    });

                    //http://asnsblues.blogspot.com/2011/11/google-maps-query-string-parameters.html
                    $(document).on("click", dirDivId + ' button#print_sub', function () {
                        var old_a_addr = $(dirDivId + ' input#a_address').val();
                        var old_b_addr = $(dirDivId + ' input#b_address').val();

                        var dirflag = "d";
                        if ($(dirDivId + ' a#dir_w_btn').hasClass('selected')) {
                            dirflag = "w";
                        }

                        var url = "http://maps.google.com/?saddr=" + old_a_addr + "&daddr=" + old_b_addr + "&dirflg=" + dirflag + "&pw=2";

                        var is_miles = $('input#' + mapDivId + '_radio_miles').is(":checked");
                        if (is_miles) {
                            url += "&doflg=ptm";
                        } else {
                            url += "&doflg=ptk";
                        }

                        if (dirflag === "d") {
                            var is_avoid_hway = $('input#' + mapDivId + '_avoid_hway').is(":checked");
                            var is_avoid_tolls = $('input#' + mapDivId + '_avoid_tolls').is(":checked");
                            if (is_avoid_hway) {
                                url += "&dirflg=h";
                            }
                            if (is_avoid_tolls) {
                                url += "&dirflg=t";
                            }
                        }

                        window.open(url);
                        return false;
                    });

                    $(document).on("change focus", dirDivId + ' input#a_address', function () {
                        $(dirDivId + ' input#a_address').removeClass('d_error');
                        return false;
                    });

                    $(document).on("change focus", dirDivId + ' input#b_address', function () {
                        $(dirDivId + ' input#b_address').removeClass('d_error');
                        return false;
                    });


                    $(document).on("click", dirDivId + ' .kd-button', function () {
                        var thisId = this.id;

                        if (thisId == 'dir_d_btn') {
                            if ($(dirDivId + ' a#dir_d_btn').hasClass('selected')) {
                                Logger.warn("Driving travel mode is already selected");
                            } else {
                                $(dirDivId + ' a#dir_d_btn').addClass('selected');
                                $(dirDivId + ' a#dir_w_btn').removeClass('selected');
                            }
                        } else if (thisId == 'dir_w_btn') {
                            if ($(dirDivId + ' a#dir_w_btn').hasClass('selected')) {
                                Logger.warn("Walking travel mode is already selected");
                            } else {
                                $(dirDivId + ' a#dir_w_btn').addClass('selected');
                                $(dirDivId + ' a#dir_d_btn').removeClass('selected');
                            }
                        }

                        return false;
                    });

                }

                function buildBubble(contentFromMarker, markersElement) {
                    var randomNumber = Math.floor(Math.random() * 111111);
                    randomNumber = randomNumber + "-" + mapDivId;

                    var bubble = "<div id='bubble-" + randomNumber + "' style='height: 130px !important; width: 300px !important;' class='bubble-content'>";
                    if ((!markersElement.geoMashup || (markersElement.geoMashup && !markersElement.infoBubbleContainPostLink))) {
                        bubble += "<h4>" + CGMPGlobal.translations.address + ":</h4>";
                        bubble += "<p class='custom-bubble-text'>" + contentFromMarker + "</p>";
                        if (markersElement.customBubbleText != '') {
                            bubble += "<p class='custom-bubble-text'>" + markersElement.customBubbleText + "</p>";
                        }
                    } else {
                        var substr = markersElement.postTitle.substring(0, 30);
                        bubble += "";
                        bubble += "<p class='geo-mashup-post-title'><a title='Original post: " + markersElement.postTitle + "' href='" + markersElement.postLink + "'>" + substr + "..</a></p>";
                        bubble += "<p class='geo-mashup-post-excerpt'>" + markersElement.postExcerpt + "</p>";
                    }
                    bubble += "<div class='custom-bubble-links-section'>";
                    bubble += "<hr />";
                    bubble += "<p class='custom-bubble-text'>" + CGMPGlobal.translations.directions + ": <a id='toHere-" + randomNumber + "' class='dirToHereTrigger' href='javascript:void(0);'>" + CGMPGlobal.translations.toHere + "</a> - <a id='fromHere-" + randomNumber + "' class='dirFromHereTrigger' href='javascript:void(0);'>" + CGMPGlobal.translations.fromHere + "</a> | <a id='trigger-" + randomNumber + "' class='streetViewTrigger' href='javascript:void(0);'>" + CGMPGlobal.translations.streetView + "</a></p>";
                    bubble += "</div></div>";

                    return {
                        bubbleHolderId: randomNumber,
                        bubbleContent: bubble
                    };
                }


                /*
                 * Licensed under the Apache License, Version 2.0 (the "License");
                 * you may not use this file except in compliance with the License.
                 * You may obtain a copy of the License at
                 *
                 *       http://www.apache.org/licenses/LICENSE-2.0
                 *
                 * Unless required by applicable law or agreed to in writing, software
                 * distributed under the License is distributed on an "AS IS" BASIS,
                 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
                 * See the License for the specific language governing permissions and
                 * limitations under the License.
                 */
                /**
                 * @name GeolocationMarker for Google Maps v3
                 * @version version 1.0
                 * @author Chad Killingsworth [chadkillingsworth at missouristate.edu]
                 * Copyright 2012 Missouri State University
                 * @fileoverview
                 * This library uses geolocation to add a marker and accuracy circle to a map.
                 * The marker position is automatically updated as the user position changes.
                 */

                /**
                 * @constructor
                 * @extends {google.maps.MVCObject}
                 * @param {google.maps.Map=} opt_map
                 * @param {(google.maps.MarkerOptions|Object.<string>)=} opt_markerOpts
                 * @param {(google.maps.CircleOptions|Object.<string>)=} opt_circleOpts
                 */
                function GeolocationMarker(opt_map, opt_markerOpts, opt_circleOpts) {

                    var markerOpts = {
                        'clickable': false,
                        'cursor': 'pointer',
                        'draggable': false,
                        'flat': true,
                        'icon': {
                            'url': CGMPGlobal.customMarkersUri + 'gpsloc.png',
                            'size': new google.maps.Size(34, 34),
                            'scaledSize': new google.maps.Size(17, 17),
                            'origin': new google.maps.Point(0, 0),
                            'anchor': new google.maps.Point(8, 8)
                        },
                        // This marker may move frequently - don't force canvas tile redraw
                        'optimized': false,
                        'position': new google.maps.LatLng(0, 0),
                        'title': 'Current location',
                        'zIndex': 2
                    };

                    if (opt_markerOpts) {
                        markerOpts = this.copyOptions_(markerOpts, opt_markerOpts);
                    }

                    var circleOpts = {
                        'clickable': false,
                        'radius': 0,
                        'strokeColor': '1bb6ff',
                        'strokeOpacity': .4,
                        'fillColor': '61a0bf',
                        'fillOpacity': .4,
                        'strokeWeight': 1,
                        'zIndex': 1
                    };

                    if (opt_circleOpts) {
                        circleOpts = this.copyOptions_(circleOpts, opt_circleOpts);
                    }

                    this.marker_ = new google.maps.Marker(markerOpts);
                    this.circle_ = new google.maps.Circle(circleOpts);

                    /**
                     * @expose
                     * @type {number?}
                     */
                    this.accuracy = null;

                    /**
                     * @expose
                     * @type {google.maps.LatLng?}
                     */
                    this.position = null;

                    /**
                     * @expose
                     * @type {google.maps.Map?}
                     */
                    this.map = null;

                    this.set('minimum_accuracy', null);

                    this.set('position_options', /** GeolocationPositionOptions */
                        ({enableHighAccuracy: true, maximumAge: 1000}));

                    this.circle_.bindTo('map', this.marker_);

                    if (opt_map) {
                        this.setMap(opt_map);
                    }
                }

                GeolocationMarker.prototype = new google.maps.MVCObject;

                /**
                 * @override
                 * @expose
                 * @param {string} key
                 * @param {*} value
                 */
                GeolocationMarker.prototype.set = function (key, value) {
                    if (/^(?:position|accuracy)$/i.test(key)) {
                        throw '\'' + key + '\' is a read-only property.';
                    } else if (/map/i.test(key)) {
                        this.setMap(/** @type {google.maps.Map} */ (value));
                    } else {
                        google.maps.MVCObject.prototype.set.apply(this, arguments);
                    }
                };

                /**
                 * @private
                 * @type {google.maps.Marker}
                 */
                GeolocationMarker.prototype.marker_ = null;

                /**
                 * @private
                 * @type {google.maps.Circle}
                 */
                GeolocationMarker.prototype.circle_ = null;

                /** @return {google.maps.Map} */
                GeolocationMarker.prototype.getMap = function () {
                    return this.map;
                };

                /** @return {GeolocationPositionOptions} */
                GeolocationMarker.prototype.getPositionOptions = function () {
                    return /** @type GeolocationPositionOptions */(this.get('position_options'));
                };

                /** @param {GeolocationPositionOptions|Object.<string, *>} positionOpts */
                GeolocationMarker.prototype.setPositionOptions = function (positionOpts) {
                    this.set('position_options', positionOpts);
                };

                /** @return {google.maps.LatLng?} */
                GeolocationMarker.prototype.getPosition = function () {
                    return this.position;
                };

                /** @return {google.maps.LatLngBounds?} */
                GeolocationMarker.prototype.getBounds = function () {
                    if (this.position) {
                        return this.circle_.getBounds();
                    } else {
                        return null;
                    }
                };

                /** @return {number?} */
                GeolocationMarker.prototype.getAccuracy = function () {
                    return this.accuracy;
                };

                /** @return {number?} */
                GeolocationMarker.prototype.getMinimumAccuracy = function () {
                    return /** @type {number?} */ (this.get('minimum_accuracy'));
                };

                /** @param {number?} accuracy */
                GeolocationMarker.prototype.setMinimumAccuracy = function (accuracy) {
                    this.set('minimum_accuracy', accuracy);
                };

                /**
                 * @private
                 * @type {number}
                 */
                GeolocationMarker.prototype.watchId_ = -1;

                /** @param {google.maps.Map} map */
                GeolocationMarker.prototype.setMap = function (map) {
                    this.map = map;
                    this.notify('map');
                    if (map) {
                        this.watchPosition_();
                    } else {
                        this.marker_.unbind('position');
                        this.circle_.unbind('center');
                        this.circle_.unbind('radius');
                        this.accuracy = null;
                        this.position = null;
                        navigator.geolocation.clearWatch(this.watchId_);
                        this.watchId_ = -1;
                        this.marker_.setMap(map);
                    }
                };

                /** @param {google.maps.MarkerOptions|Object.<string>} markerOpts */
                GeolocationMarker.prototype.setMarkerOptions = function (markerOpts) {
                    this.marker_.setOptions(this.copyOptions_({}, markerOpts));
                };

                /** @param {google.maps.CircleOptions|Object.<string>} circleOpts */
                GeolocationMarker.prototype.setCircleOptions = function (circleOpts) {
                    this.circle_.setOptions(this.copyOptions_({}, circleOpts));
                };

                /**
                 * @private
                 * @param {GeolocationPosition} position
                 */
                GeolocationMarker.prototype.updatePosition_ = function (position) {
                    var newPosition = new google.maps.LatLng(position.coords.latitude,
                        position.coords.longitude), mapNotSet = this.marker_.getMap() == null;

                    if (mapNotSet) {
                        if (this.getMinimumAccuracy() != null &&
                            position.coords.accuracy > this.getMinimumAccuracy()) {
                            return;
                        }
                        this.marker_.setMap(this.map);
                        this.marker_.bindTo('position', this);
                        this.circle_.bindTo('center', this, 'position');
                        this.circle_.bindTo('radius', this, 'accuracy');
                    }

                    if (this.accuracy != position.coords.accuracy) {
                        // The local set method does not allow accuracy to be updated
                        google.maps.MVCObject.prototype.set.call(this, 'accuracy', position.coords.accuracy);
                    }

                    if (mapNotSet || this.position == null || !this.position.equals(newPosition)) {
                        // The local set method does not allow position to be updated
                        google.maps.MVCObject.prototype.set.call(this, 'position', newPosition);
                    }
                };

                /**
                 * @private
                 * @return {undefined}
                 */
                GeolocationMarker.prototype.watchPosition_ = function () {
                    var self = this;

                    if (navigator.geolocation) {
                        this.watchId_ = navigator.geolocation.watchPosition(
                            function (position) {
                                self.updatePosition_(position);
                            },
                            function (e) {
                                google.maps.event.trigger(self, "geolocation_error", e);
                            },
                            this.getPositionOptions());
                    }
                };

                /**
                 * @private
                 * @param {Object.<string,*>} target
                 * @param {Object.<string,*>} source
                 * @return {Object.<string,*>}
                 */
                GeolocationMarker.prototype.copyOptions_ = function (target, source) {
                    for (var opt in source) {
                        if (GeolocationMarker.DISALLOWED_OPTIONS[opt] !== true) {
                            target[opt] = source[opt];
                        }
                    }
                    return target;
                };

                /**
                 * @const
                 * @type {Object.<string, boolean>}
                 */
                GeolocationMarker.DISALLOWED_OPTIONS = {
                    'map': true,
                    'position': true,
                    'radius': true
                };

                return {
                    init: init,
                    setGeoLocationIfEnabled: setGeoLocationIfEnabled,
                    buildAddressMarkers: buildAddressMarkers,
                    isBuildAddressMarkersCalled: isBuildAddressMarkersCalled
                }
            };


            var Utils = (function () {
                var isNumeric = function isNumeric(subject) {
                    var numericRegex = /^([0-9?(\-.,;\s{1,})]+)$/;
                    return numericRegex.test(subject);
                }

                var isAlphaNumeric = function isAlphaNumeric(subject) {
                    var addressRegex = /^([a-zA-Z0-9?(/\-.,\s{1,})]+)$/;
                    return addressRegex.test(subject);
                }

                var trim = function trim(subject) {
                    var trimRegex = /^\s+|\s+$/g;
                    return subject.replace(trimRegex, '');
                }

                var searchReplace = function searchReplace(subject, search, replace) {
                    return subject.replace(new RegExp(search, "g"), replace);
                }

                return {
                    isNumeric: isNumeric,
                    isAlphaNumeric: isAlphaNumeric,
                    trim: trim,
                    searchReplace: searchReplace
                }
            })();


            var Logger = (function () {
                var info = function info(message) {
                    var msg = "Info :: " + message;
                    print(msg);
                }
                var raw = function raw(msg) {
                    print(msg);
                }
                var warn = function warn(message) {
                    var msg = "Warning :: " + message;
                    print(msg);
                }
                var error = function error(message) {
                    var msg = "Error :: " + message;
                    print(msg);
                }
                var fatal = function fatal(message) {
                    var msg = "Fatal :: " + message;
                    print(msg);
                }
                var print = function print(message) {
                    if (navigator.userAgent.match(/msie|trident/i)) {
                        //Die... die... die.... why dont you just, die???
                    } else {
                        console.log(message);
                    }
                }

                return {
                    info: info,
                    raw: raw,
                    warn: warn,
                    error: error,
                    fatal: fatal
                }
            })();


            var Errors = (function () {

                var alertError = function alertError(content) {

                    var mask = $('<div id="cgmp-popup-mask"/>');
                    var id = Math.random().toString(36).substring(3);
                    var shortcode_dialog = $('<div id="' + id + '" class="cgmp-popup-shortcode-dialog cgmp-popup-window">');
                    shortcode_dialog.html("<div class='dismiss-container'><a class='dialog-dismiss' href='javascript:void(0)'>Ã—</a></div><p style='text-align: left; padding: 10px 10px 0 10px'>" + content + "</p><div align='center'><input type='button' class='close-dialog' value='Close' /></div>");

                    $('body').append(mask);
                    $('body').append(shortcode_dialog);

                    var maskHeight = $(document).height();
                    var maskWidth = $(window).width();
                    $('#cgmp-popup-mask').css({
                        'width': maskWidth,
                        'height': maskHeight,
                        'opacity': 0.1
                    });

                    if ($("#cgmp-popup-mask").length == 1) {
                        $('#cgmp-popup-mask').show();
                    }

                    var winH = $(window).height();
                    var winW = $(window).width();
                    $("div#" + id).css('top', winH / 2 - $("div#" + id).height() / 2);
                    $("div#" + id).css('left', winW / 2 - $("div#" + id).width() / 2);
                    $("div#" + id).fadeIn(500);
                    $('.cgmp-popup-window .close-dialog').click(function (e) {
                        close_dialog(e, $(this));
                    });
                    $('.cgmp-popup-window .dialog-dismiss').click(function (e) {
                        close_dialog(e, $(this));
                    });

                    function close_dialog(e, object) {
                        e.preventDefault();

                        var parentDialog = $(object).closest("div.cgmp-popup-shortcode-dialog");
                        if (parentDialog) {
                            $(parentDialog).remove();
                        }

                        if ($("div.cgmp-popup-shortcode-dialog").length == 0) {
                            $('#cgmp-popup-mask').remove();
                        }
                    }

                    $('#cgmp-popup-mask').click(function () {
                        $(this).remove();
                        $('.cgmp-popup-window').remove();
                    });
                    $(window).resize(function () {
                        var box = $('.window');
                        var maskHeight = $(document).height();
                        var maskWidth = $(window).width();
                        $('#cgmp-popup-mask').css({
                            'width': maskWidth,
                            'height': maskHeight
                        });
                        var winH = $(window).height();
                        var winW = $(window).width();
                        box.css('top', winH / 2 - box.height() / 2);
                        box.css('left', winW / 2 - box.width() / 2);
                    });
                }

                return {
                    alertError: alertError
                }
            })();

            if ($('object#global-data-placeholder').length == 0) {
                Logger.fatal("The global HTML <object> element is undefined. Aborting map generation .. d[-_-]b");
                return;
            }

            var head = document.head || document.getElementsByTagName("head")[0] || document.documentElement;
            var link = document.createElement('link');
            link.type = 'text/css';
            link.rel = 'stylesheet';
            link.href = $("object#global-data-placeholder").find("param#cssHref").val();
            link.media = 'screen';
            head.appendChild(link);

            CGMPGlobal.sep = $("object#global-data-placeholder").find("param#sep").val();
            CGMPGlobal.noBubbleDescriptionProvided = $("object#global-data-placeholder").find("param#noBubbleDescriptionProvided").val();
            CGMPGlobal.customMarkersUri = $("object#global-data-placeholder").find("param#customMarkersUri").val();
            CGMPGlobal.errors = $("object#global-data-placeholder").find("param#errors").val();

            CGMPGlobal.errors = parseJson(CGMPGlobal.errors);
            CGMPGlobal.translations = $("object#global-data-placeholder").find("param#translations").val();
            CGMPGlobal.translations = parseJson(CGMPGlobal.translations);

            var versionMajor = parseFloat($.fn.jquery.split(".")[0]);
            var versionMinor = parseFloat($.fn.jquery.split(".")[1]);
            if ((versionMajor < 1) || (versionMajor >= 1 && versionMajor < 2 && versionMinor < 3)) {
                alert(CGMPGlobal.errors.oldJquery);
                Logger.fatal("Client uses jQuery older than the version 1.3.0. Aborting map generation ..");
                return false;
            }

            if (typeof google === "undefined" || !google) {
                Errors.alertError(CGMPGlobal.errors.msgNoGoogle);
                Logger.fatal("We do not have reference to Google API. Aborting map generation ..");
                return false;
            } else if (typeof GMap2 !== "undefined" && GMap2) {
                Errors.alertError(CGMPGlobal.errors.msgApiV2);
                Logger.fatal("It looks like the webpage has reference to GMap2 object from Google API v2. Aborting map generation ..");
                return false;
            }

            CGMPGlobal.language = $("object#global-data-placeholder").find("param#language").val();
            google.load('maps', '3', {
                other_params: 'sensor=false&libraries=panoramio&language=' + CGMPGlobal.language,
                callback: function () {
                    google_map_api_callback();
                }
            });

            function google_map_api_callback() {

                $("object.cgmp-json-string-placeholder").each(function (index, element) {

                    var currentElementId = $(element).attr('id');
                    var jsonString = $(element).find('param#json-string-' + currentElementId).val();
                    jsonString = Utils.searchReplace(jsonString, "'", "");
                    jsonString = jsonString.replace("&quot;", "");

                    var json = parseJson(jsonString);

                    if (typeof json === "undefined" || !json) {
                        Logger.fatal("We did not parse JSON from OBJECT param. Aborting map generation ..");
                        return false;
                    }

                    if ($('div#' + json.id).length > 0) {

                        var googleMap = new google.maps.Map(document.getElementById(json.id));

                        GoogleMapOrchestrator.initMap(googleMap, json.bubbleautopan, parseInt(json.zoom), json.maptype);
                        LayerBuilder.init(googleMap);

                        var markerBuilder = new MarkerBuilder();
                        markerBuilder.init(googleMap, json.bubbleautopan, json.distanceunits);
                        markerBuilder.setGeoLocationIfEnabled(json.enablegeolocationmarker);

                        var controlOptions = {
                            mapTypeControl: (json.maptypecontrol === 'true'),
                            panControl: (json.pancontrol === 'true'),
                            zoomControl: (json.zoomcontrol === 'true'),
                            scaleControl: (json.scalecontrol === 'true'),
                            scrollwheel: (json.scrollwheelcontrol === 'true'),
                            streetViewControl: (json.streetviewcontrol === 'true'),
                            tilt: (json.tiltfourtyfive === 'true' ? 45 : null),
                            draggable: (json.draggable === 'true'),
                            overviewMapControl: true,
                            overviewMapControlOptions: {
                                opened: false
                            }
                        };
                        GoogleMapOrchestrator.setMapControls(controlOptions);

                        if (json.showpanoramio === "true") {
                            LayerBuilder.buildPanoramioLayer(json.panoramiouid);
                        }

                        if (json.showbike === "true") {
                            LayerBuilder.buildBikeLayer();
                        }
                        if (json.showtraffic === "true") {
                            LayerBuilder.buildTrafficLayer();
                        }

                        if (json.kml != null && Utils.trim(json.kml) != '') {
                            LayerBuilder.buildKmlLayer(json.kml);
                        } else {

                            if (json.markerlist != null && Utils.trim(json.markerlist) != '') {
                                markerBuilder.buildAddressMarkers(json.markerlist, json.addmarkermashup, json.addmarkermashupbubble);
                            }

                            var isBuildAddressMarkersCalled = markerBuilder.isBuildAddressMarkersCalled();
                            if (!isBuildAddressMarkersCalled) {
                                Errors.alertError(CGMPGlobal.errors.msgMissingMarkers);
                            }
                        }

                        // An attempt to resolve a problem of Google Maps & jQuery Tabs
                        $(document).ready(function () {
                            var timeout = null;
                            var timeoutDelay = 500;
                            var mapPlaceholder = 'div#' + json.id;

                            if ($(mapPlaceholder).is(":hidden")) {
                                Logger.warn("Map placeholder DIV is hidden, must resize the map!");
                                resizeMapWhenPlaceholderBecomesVisible();
                            } else {
                                // Just to be on a safe side lets resize
                                setTimeout(function () {resize_map(googleMap); }, timeoutDelay);
                            }

                            function resizeMapWhenPlaceholderBecomesVisible() {
                                if (timeout != null) {
                                    clearTimeout(timeout);
                                }
                                if ($(mapPlaceholder).is(":hidden")) {
                                    timeout = setTimeout(resizeMapWhenPlaceholderBecomesVisible, timeoutDelay);
                                } else {
                                    setTimeout(function () {resize_map(googleMap);}, timeoutDelay);
                                }
                            }

                            function resize_map(googleMap) {
                                if (googleMap) {
                                    var oldZoom = googleMap.getZoom();
                                    var oldBounds = googleMap.getBounds();
                                    var oldCenter = googleMap.getCenter();
                                    google.maps.event.trigger(googleMap, "resize");
                                    googleMap.setZoom(oldZoom);
                                    googleMap.setCenter(oldCenter);
                                    googleMap.getBounds(oldBounds);
                                }
                            }
                        });
                    } else {
                        Logger.fatal("It looks like the map DIV placeholder ID [" + json.id + "] does not exist in the page!");
                    }
                });
            }
        }(jQueryObj));
    }
})();