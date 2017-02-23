var CHECK_INTERVAL = 300000; // 5 minutes
var THRESHOLD = 1; // $1.00

if ( !localStorage[ "resource" ] ) { localStorage[ "resource" ] = ""; }
if ( !localStorage[ "interval" ] ) { localStorage[ "interval" ] = CHECK_INTERVAL; }
if ( !localStorage[ "threshold" ] ) { localStorage[ "threshold" ] = THRESHOLD; }
if ( !localStorage[ "notify" ] ) { localStorage[ "notify" ] = true; }
if ( !localStorage[ "sound" ] ) { localStorage[ "sound" ] = true; }
if ( !localStorage[ "graph" ] ) { localStorage[ "graph" ] = true; }
if ( !localStorage[ "history" ] ) { localStorage[ "history" ] = JSON.stringify( [] ); }
if ( !localStorage[ "variance" ] ) { localStorage[ "variance" ] = JSON.stringify( [] ); }
if ( !localStorage[ "minutes" ] ) { localStorage[ "minutes" ] = JSON.stringify( [] ); }
if ( !localStorage[ "badge" ] ) { localStorage[ "badge" ] = true; }

getRoyalties();

function getRoyalties( callback ) {
	var resource = localStorage[ "resource" ];
	if ( !resource ) { return; }

	clearTimeout( localStorage[ "timeout" ] );
	loadingBadge();
	var xhr = new XMLHttpRequest();
	xhr.open( "GET", "https://egghead.io/api/v1/instructors/" + resource, true );
	xhr.onreadystatechange = function() {
		if ( xhr.readyState == 4 ) {
			var response = JSON.parse( xhr.response );
			handleRoyalties( response, callback );
			localStorage[ "timeout" ] = window.setTimeout( getRoyalties, parseInt( localStorage[ "interval" ] ) );
		}
	}
	xhr.send();
}

function getHistory() {
	var history = JSON.parse( localStorage[ "history" ] );
	return history.map( function( value ) {
		return parseFloat( value );
	} );
}

function getVariance() {
	var variance = JSON.parse( localStorage[ "variance" ] );
	return variance.map( function( value ) {
		return parseFloat( value );
	} );
}

function getMinutes() {
	var minutes = JSON.parse( localStorage[ "minutes" ] );
	return minutes.map( function( value ) {
		return parseFloat( value );
	} );
}

function pushHistory( value ) {
	var history = getHistory();
	history.push( value );
	localStorage[ "history" ] = JSON.stringify( history );
}

function pushVariance( value ) {
	var variance = JSON.parse( localStorage[ "variance" ] );
	variance.push( value );
	localStorage[ "variance" ] = JSON.stringify( variance );
}

function pushMinutes( value ) {
	var minutes = JSON.parse( localStorage[ "minutes" ] );
	minutes.push( value );
	localStorage[ "minutes" ] = JSON.stringify( minutes );
}

function handleRoyalties( response, callback ) {
	if ( response.error ) {
		chrome.browserAction.setBadgeText({ text: "!" });
		chrome.browserAction.setBadgeBackgroundColor({ color: "#da573b" });
		callback && callback( response );
		return;
	}

	var currentMonth = response.revenue[ response.revenue.length - 1 ];
	var revenue = currentMonth.revenue; 
	var minutes = currentMonth.minutes_watched;
	var previous = localStorage[ "previous" ] || 0;
	var envelope = { previous: previous, difference: 0, value: 0 };

	localStorage[ "previous" ] = revenue;
	pushHistory( revenue.toFixed( 2 ) );
	var difference = revenue - previous;
	envelope = {
		avatar_url: response.avatar_url,
		full_name: response.full_name,
		previous: previous,
		revenue: revenue,
		minutes: minutes,
		difference: difference,
		pending_lessons: response.pending_lessons,
		submitted_lessons: response.submitted_lessons,
		claimed_lessons: response.claimed_lessons,
		reviewing_lessons: response.reviewing_lessons,
		approved_lessons: response.approved_lessons,
		published_lessons: response.published_lessons,
		published_courses: response.published_courses,
		months: response.revenue
	};
	pushVariance( difference.toFixed( 2 ) );
	pushMinutes( minutes );

	//pushRoyalties( { revenue, difference, minutes } );
	update( envelope );

	if ( callback ) { callback( envelope ) };
}

function update( royalties ) {
	updateBadge( royalties );
	if ( royalties.difference >= parseFloat( localStorage[ "threshold" ] ) ) {
		var difference = royalties.difference.toLocaleString( "en-US", { style: "currency", currency: "USD" } );
		difference = royalties.difference > 0 ? "+" + difference : difference;

		if ( localStorage[ "notify" ] === "true" ) {
			notify( "🌟 " + royalties.revenue.toLocaleString( "en-US", { style: "currency", currency: "USD" } ) + " (" + difference + ")" );
		}

		if ( localStorage[ "sound" ] === "true" ) {
			var audio = new Audio();
			audio.src = "src/background/cha-ching.mp3";
			audio.play();
		}
	}
}

function loadingBadge() {
	if ( localStorage[ "badge" ] === "true" ) {
		chrome.browserAction.setBadgeText({ text: "..." });
		chrome.browserAction.setBadgeBackgroundColor({ color: "#5183b4" });
	} else {
		chrome.browserAction.setBadgeText( { text: "" } );
	}
}

function updateBadge( royalties ) {
	var title = royalties.difference > 0 ?
		"+$" + royalties.difference.toFixed( 2 ) :
		"$" + royalties.difference.toFixed( 2 ); 
	chrome.browserAction.setTitle({ title: title });
	if ( localStorage[ "badge" ] === "true" ) {
		if ( royalties.difference > 0 ) {
			chrome.browserAction.setBadgeBackgroundColor({ color: "#449d44" });
		} else {
			chrome.browserAction.setBadgeBackgroundColor({ color: "#5e5e5e" });
		}
		chrome.browserAction.setBadgeText({
			text: abbreviateNumber( royalties.revenue )
		});
	} else {
		chrome.browserAction.setBadgeText( { text: "" } );
	}
}

function abbreviateNumber( value ) {
	value = Math.floor( value );
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
