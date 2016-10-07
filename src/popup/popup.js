var background = chrome.extension.getBackgroundPage();

document.addEventListener( "DOMContentLoaded", function() {
	refresh();

	document.querySelector( ".options" ).addEventListener( "click", function() {
		chrome.runtime.openOptionsPage();
	} );
} );

function refresh() {
	background.getRoyalties( function( royalties ) {
		document.documentElement.classList.remove( "loading" );
		document.getElementById( "popup" ).innerHTML = royalties.html;
		if ( localStorage[ "graph" ] === "true" ) {
			generateSparkline();
		}
	} );
}

function generateSparkline() {
	var history = background.getHistory().map( function( value ) {
		return parseFloat( value );
	} );
	document.querySelector( "textarea" ).innerHTML = JSON.stringify( history, null, 2 );
	document.querySelector( ".sparkline" ).classList.toggle( "sparkline--empty", history.length <= 1 );
	$( ".sparkline" ).sparkline( history, {
		height: "48px",
		width: "325px",
		lineColor: "#fff",
		fillColor: "#b7b7b7",
		spotColor: "#5183b4",
		spotRadius: 5,
		minSpotColor: "#da573b",
		maxSpotColor: "#6fab4a",
		highlightSpotColor: "#f5f",
		highlightLineColor: "#f22",
		// tooltipFormat: $.spformat("{{value}}", "tooltip-class")
	} );
}
