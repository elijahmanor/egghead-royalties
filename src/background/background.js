var CHECK_INTERVAL = 300000; // 5 minutes
var THRESHOLD = 1; // $1.00

if ( !localStorage[ "interval" ] ) { localStorage[ "interval" ] = CHECK_INTERVAL; }
if ( !localStorage[ "threshold" ] ) { localStorage[ "threshold" ] = THRESHOLD; }
if ( !localStorage[ "notify" ] ) { localStorage[ "notify" ] = true; }
if ( !localStorage[ "sound" ] ) { localStorage[ "sound" ] = true; }
if ( !localStorage[ "graph" ] ) { localStorage[ "graph" ] = true; }
if ( !localStorage[ "history" ] ) { localStorage[ "history" ] = JSON.stringify( [] ); }

getRoyalties();

function getRoyalties( callback ) {
	clearTimeout( localStorage[ "timeout" ] );
	loadingBadge();
	var xhr = new XMLHttpRequest();
	xhr.open( "GET", "https://egghead.io/", true );
	xhr.onreadystatechange = function() {
		if ( xhr.readyState == 4 ) {
			var parser = new DOMParser();
			var doc = parser.parseFromString( xhr.responseText, "text/html" );
			handleRoyalties( doc, callback );
			localStorage[ "timeout" ] = window.setTimeout( getRoyalties, parseInt( localStorage[ "interval" ] ) );
		}
	}
	xhr.send();
}

function getHistory() { return JSON.parse( localStorage[ "history" ] ); }
function pushHistory( value ) {
	var history = getHistory();
	history.push( value );
	localStorage[ "history" ] = JSON.stringify( history );
}

function handleRoyalties( doc, callback ) {
	var royalties = doc.querySelector( ".hero strong" );
	var old = localStorage[ "old" ] || "$0.00";
	var envelope = { old: old, new: "", difference: 0, value: "", html: "" };

	if ( royalties ) {
		var dollars = royalties.innerText.replace( /\$(\d+)\.\d{2}/, function( match, p1 ) { return p1; } );
		localStorage[ "old" ] = royalties.innerText;
		pushHistory( royalties.innerText.substr( 1 ) );
		var html = doc.querySelector( ".hero" ).outerHTML;
		envelope = {
			old: old,
			new: royalties.innerText,
			difference: valueDifference( old, royalties.innerText ),
			value: dollars,
			html: html
		};
		update( envelope );
	} else {
		chrome.browserAction.setBadgeText({ text: "!" });
		chrome.browserAction.setBadgeBackgroundColor({ color: "#da573b" });
	}

	if ( callback ) { callback( envelope ) };
}

function update( royalties ) {
	updateBadge( royalties );
	if ( royalties.difference >= parseFloat( localStorage[ "threshold" ] ) ) {
		var difference = royalties.difference.toLocaleString( "en-US", { style: "currency", currency: "USD" } );
		difference = royalties.difference > 0 ? "+" + difference : difference;

		if ( localStorage[ "notify" ] === "true" ) {
			notify( "🌟 " + royalties.new + " (" + difference + ")" );
		}

		if ( localStorage[ "sound" ] === "true" ) {
			var audio = new Audio();
			audio.src = "src/background/cha-ching.mp3";
			audio.play();
		}
	}
}

function loadingBadge() {
	chrome.browserAction.setBadgeText({ text: "..." });
	chrome.browserAction.setBadgeBackgroundColor({ color: "#5183b4" });
}

function updateBadge( royalties ) {
	if ( royalties.difference > 0 ) {
		chrome.browserAction.setBadgeBackgroundColor({ color: "#449d44" });
	} else {
		chrome.browserAction.setBadgeBackgroundColor({ color: "#5e5e5e" });
	}
	chrome.browserAction.setBadgeText({
		text: abbreviateNumber( royalties.value )
	});
}

function valueDifference( before, after ) {
	before = parseFloat( before.substr( 1 ) );
	after = parseFloat( after.substr( 1 ) );
	return after - before;
}

function abbreviateNumber( value ) {
	if ( value < 1000 ) { return "" + value; }
	var suffixes = ["", "k", "m", "b", "t"];
	var suffixNum = Math.floor( ( "" + value ).length / 3 );
	var shortValue = parseFloat( ( suffixNum !== 0 ?
		( value / Math.pow( 1000, suffixNum ) ) : value ).toPrecision( 2 ) );
	if ( shortValue % 1 !== 0 ) { shortNum = shortValue.toFixed( 1 ); }
	return shortValue + suffixes[ suffixNum ];
}

function notify( message ) {
	var options = {
		type: "basic",
		title: "Royalties",
		message: message,
		iconUrl: "../../icons/icon128.png"
	};
	chrome.notifications.create( "egghead", options );
}
