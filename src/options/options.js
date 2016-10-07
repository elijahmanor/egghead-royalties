document.addEventListener( "DOMContentLoaded", function() {
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

	var background = chrome.extension.getBackgroundPage();

	interval.element.value = interval.value;
	threshold.element.value = parseFloat( threshold.value ).toFixed( 2 );
	notify.element.checked = notify.value === "true";
	sound.element.checked = sound.value === "true";
	graph.element.checked = graph.value === "true";

	document.querySelector( "textarea" ).innerHTML = JSON.stringify( {
		interval: interval.value,
		threshold: threshold.value,
		notify: notify.value,
		sound: sound.value,
		graph: graph.value
	}, null, 2 );

	document.getElementById( "save" ).addEventListener( "click", function() {
		localStorage[ "interval" ] = interval.element.value;
		localStorage[ "threshold" ] = threshold.element.value;
		localStorage[ "sound" ] = sound.element.checked;
		localStorage[ "notify" ] = notify.element.checked;
		localStorage[ "graph" ] = graph.element.checked;
		background.getRoyalties();
		document.querySelector( ".status" ).innerHTML = "Changes have been saved!";
	} );

	document.getElementById( "reset" ).addEventListener( "click", function() {
		localStorage[ "history" ] = JSON.stringify( [] );
	} );
}, false );
