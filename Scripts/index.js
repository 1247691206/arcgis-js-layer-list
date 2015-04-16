
/*global require*/
require(["esri/arcgis/utils",
	"esri/config",
	"esri/domUtils",
	"layer-list",
	"dojo/text!./webmap.json"
], function (arcgisUtils, esriConfig, domUtils, LayerList, webmap) {
	"use strict";

	// Specify CORS enabled servers.
	["www.wsdot.wa.gov", "wsdot.wa.gov", "gispublic.dfw.wa.gov"].forEach(function (svr) {
		esriConfig.defaults.io.corsEnabledServers.push(svr);
	});
	// Since CORS servers are explicitly specified, CORS detection is not necessary.
	// This prevents the following types of errors from appearing in the console:
	// XMLHttpRequest cannot load http://gis.rita.dot.gov/ArcGIS/rest/info?f=json. No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin 'http://example.com' is therefore not allowed access. 
	esriConfig.defaults.io.corsDetection = false;

	webmap = JSON.parse(webmap);

	webmap = {
		item: {
			extent: [[-126.3619, 44.2285], [-114.3099, 50.0139]],
		},
		itemData: webmap
	};

	/**
	 * Gets the layer's position in its collection (either map.graphicsLayersIds or map.layerIds).
	 */
	function getLayerOrdinal(map, layerId) {
		var ord = null, i, l;

		for (i = 0, l = map.graphicsLayerIds.length; i < l; i += 1) {
			if (map.graphicsLayerIds[i] === layerId) {
				ord = i + 1;
				break;
			}
		}

		if (ord === null) {
			for (i = 0, l = map.layerIds.length; i < l; i += 1) {
				if (map.layerIds[i] === layerId) {
					ord = i + 1;
					break;
				}
			}
		}

		return ord;
	}



	// Create a map from a predefined webmap on AGOL.
	arcgisUtils.createMap(webmap, "map").then(function (response) {
		var map = response.map;
		var opLayers = response.itemInfo.itemData.operationalLayers;

		var layerList = new LayerList(opLayers, document.getElementById("layerlist"));

		// Update layer list items to show if they are not visible due to zoom scale.
		layerList.setScale(map.getScale());

		map.on("zoom-end", function () {
			// Update layer list items to show if they are not visible due to zoom scale.
			layerList.setScale(map.getScale());
		});

		map.on("update-start", function () {
			domUtils.show(document.getElementById("mapProgress"));
		});

		map.on("update-end", function () {
			domUtils.hide(document.getElementById("mapProgress"));
		});

		layerList.root.addEventListener("layer-move", function (e) {
			var detail = e.detail;
			var movedLayerId = detail.movedLayerId;
			var targetLayerId = detail.targetLayerId;

			var movedLayer = map.getLayer(movedLayerId);

			var targetLayerOrd = getLayerOrdinal(map, targetLayerId);

			if (targetLayerOrd !== null) {
				map.reorderLayer(movedLayer, targetLayerOrd);
			}
		});

		
	});
});