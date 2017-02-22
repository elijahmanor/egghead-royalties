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

function getHistory() { return JSON.parse( localStorage[ "history" ] ); }

function getVariance() { return JSON.parse( localStorage[ "variance" ] ).slice( -58 ); }

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

/*
{
  "id": 77,
  "slug": "elijah-manor",
  "full_name": "Elijah Manor",
  "first_name": "Elijah",
  "last_name": "Manor",
  "twitter": "elijahmanor",
  "website": "http://elijahmanor.com",
  "bio": "",
  "bio_short": "Elijah Manor is a Christian and a family man. He works at LeanKit as a senior software engineer and focuses on front-end development",
  "google_plus": "",
  "http_url": "https://egghead.io/instructors/elijah-manor",
  "avatar_url": "https://d2eip9sf3oo6c2.cloudfront.net/instructors/avatars/000/000/077/original/profile-500x500.jpg?1467951367",
  "lessons_url": "https://egghead.io/api/v1/instructors/elijah-manor/lessons",
  "published_lessons": 22,
  "published_courses": 1,
  "slack_id": "",
  "email": null,
  "gear_tracking_number": null,
  "pending_lessons": 0,
  "claimed_lessons": 0,
  "submitted_lessons": 0,
  "approved_lessons": 0,
  "reviewing_lessons": 0,
  "revenue": [
    {
      "month": "2016-09-01",
      "minutes_watched": 816,
      "revenue": 29.660032718861427
    },
    {
      "month": "2016-10-01",
      "minutes_watched": 736,
      "revenue": 27.169577250907494
    },
    {
      "month": "2016-11-01",
      "minutes_watched": 754,
      "revenue": 25.21890430723457
    },
    {
      "month": "2016-12-01",
      "minutes_watched": 1030,
      "revenue": 57.918562590272145
    },
    {
      "month": "2017-01-01",
      "minutes_watched": 840,
      "revenue": 25.467108647427704
    },
    {
      "month": "2017-02-01",
      "minutes_watched": 28687,
      "revenue": 1867.8930288589486
    }
  ]
}
*/
