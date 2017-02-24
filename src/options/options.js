document.addEventListener( "DOMContentLoaded", function() {
	var resource = {
		element: document.getElementById( "resource" ),
		value: localStorage[ "resource" ]
	};
	var interval = {
		element: document.getElementById( "interval" ),
		value: localStorage[ "interval" ]
	};
	var threshold = {
		element: document.getElementById( "threshold" ),
		value: localStorage[ "threshold" ]
	};
	var notify = {
		element: document.getElementById( "notify" ),
		value: localStorage[ "notify" ]
	};
	var sound = {
		element: document.getElementById( "sound" ),
		value: localStorage[ "sound" ]
	};
	var graph = {
		element: document.getElementById( "graph" ),
		value: localStorage[ "graph" ]
	};
	var badge = {
		element: document.getElementById( "badge" ),
		value: localStorage[ "badge" ]
	};
	var historySince = {
		element: document.getElementById( "historySince" ),
		value: localStorage[ "historySince" ]
	};
	var blurValues = {
		element: document.getElementById( "blurValues" ),
		value: localStorage[ "blurValues" ]
	};
	
	var background = chrome.extension.getBackgroundPage();

	resource.element.value = resource.value;
	interval.element.value = interval.value;
	threshold.element.value = parseFloat( threshold.value ).toFixed( 2 );
	notify.element.checked = notify.value === "true";
	sound.element.checked = sound.value === "true";
	graph.element.checked = graph.value === "true";
	badge.element.checked = badge.value === "true";
	historySince.element.valueAsDate = historySince.value ? new Date( parseInt( historySince.value ) ) : null;
	blurValues.element.checked = blurValues.value === "true";

	document.querySelector( "textarea" ).innerHTML = JSON.stringify( {
		resource: resource.value,
		interval: interval.value,
		threshold: threshold.value,
		notify: notify.value,
		sound: sound.value,
		graph: graph.value,
		historySince: historySince.value,
		blurValues: blurValues.value
	}, null, 2 );

	// document.querySelector( "textarea" ).innerHTML = JSON.stringify( JSON.parse( localStorage[ "history" ] ), null, 2 );
	// localStorage[ "history" ] = JSON.stringify();

	document.getElementById( "save" ).addEventListener( "click", function() {
		localStorage[ "resource" ] = resource.element.value;
		localStorage[ "interval" ] = interval.element.value;
		localStorage[ "threshold" ] = threshold.element.value;
		localStorage[ "sound" ] = sound.element.checked;
		localStorage[ "notify" ] = notify.element.checked;
		localStorage[ "graph" ] = graph.element.checked;
		localStorage[ "badge" ] = badge.element.checked;
		localStorage[ "blurValues" ] = blurValues.element.checked;
		localStorage[ "historySince" ] = historySince.element.value ? +moment( historySince.element.value ).toDate() : null;
		background.getRoyalties();
		document.querySelector( ".status" ).innerHTML = "Changes have been saved!";
	} );

	document.getElementById( "reset" ).addEventListener( "click", function() {
		localStorage[ "history" ] = JSON.stringify( [] );
		localStorage[ "variance" ] = JSON.stringify( [] );
		localStorage[ "minutes" ] = JSON.stringify( [] );
	} );

}, false );
