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
		if ( royalties.error ) {
			document.getElementById( "popup" ).innerHTML = royalties.error;
			return;
		}
		/*
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
		published_courses: response.published_courses
		*/
		const currency = royalties.revenue.toLocaleString( "en-US", { style: "currency", currency: "USD" } );
		const previousMonths = royalties.months.reduce( function( memo, month, index, array ) {
			if ( index !== array.length - 1 ) {
				memo.minutes += month.minutes_watched;
				memo.revenue += month.revenue;
			}
			return memo;
		}, { minutes: 0, revenue: 0 } );
		const markup =
`
<div class="Egghead">
  <div class="Egghead-profile">
    <img class="Egghead-avatar" src="${ royalties.avatar_url }" />
    <h1 class="Egghead-name">${ royalties.full_name }</h1>
  </div>
  <div class="Egghead-stats">
    <h3 class="Egghead-header">Estimated royalties</h3>
    <ul class="Egghead-royalties">
      <li><i class="fa fa-fw fa-money"></i> ${ currency }</li>
      <li><i class="fa fa-fw fa-clock-o"></i> ${ royalties.minutes.toLocaleString() } mins watched</li>
    </ul>
    <h3 class="Egghead-header">Previous 5 months</h3>
    <ul class="Egghead-royalties">
      <li><i class="fa fa-fw fa-money"></i> ${ previousMonths.revenue.toLocaleString( "en-US", { style: "currency", currency: "USD" } ) }</li>
      <li><i class="fa fa-fw fa-clock-o"></i> ${ previousMonths.minutes.toLocaleString() } mins watched</li>
    </ul>
  </div>
  <div class="Egghead-lessons">
    <div class="Egghead-lesson">
      <i class="Egghead-lessonType fa fa-fw fa-bullhorn" title="submitted"></i>
      <span class="Egghead-count" title="submitted">${ royalties.submitted_lessons }</span>
    </div>
    <div class="Egghead-lesson">
      <i class="Egghead-lessonType fa fa-fw fa-hand-rock-o" title="claimed"></i>
      <span class="Egghead-count" title="claimed">${ royalties.claimed_lessons }</span>
    </div>
    <div class="Egghead-lesson">
      <i class="Egghead-lessonType fa fa-fw fa-calendar-o" title="pending"></i>
      <span class="Egghead-count" title="pending">${ royalties.pending_lessons }</span>
    </div>
    <div class="Egghead-lesson">
      <i class="Egghead-lessonType fa fa-fw fa-search" title="reviewing"></i>
      <span class="Egghead-count" title="reviewing">${ royalties.reviewing_lessons }</span>
    </div>
    <div class="Egghead-lesson">
      <i class="Egghead-lessonType fa fa-fw fa-thumbs-up" title="approved"></i>
      <span class="Egghead-count" title="approved">${ royalties.approved_lessons }</span>
    </div>
    <div class="Egghead-lesson">
      <i class="Egghead-lessonType fa fa-fw fa-rocket" title="published"></i>
      <span class="Egghead-count" title="published">${ royalties.published_lessons }</span>
    </div>
  </div>
</div>
`;
		document.getElementById( "popup" ).innerHTML = markup;
		if ( localStorage[ "graph" ] === "true" ) {
			generateSparkline();
		}
	} );
}

function generateSparkline() {
	var history = background.getHistory().map( function( value ) {
		return parseFloat( value );
	} );

	document.querySelector( ".sparkline" ).classList.toggle( "sparkline--empty", history.length <= 1 );
	$( ".sparkline" ).sparkline( history, {
		height: "48px",
		width: "350px",
		lineColor: "#fff",
		fillColor: "#b7b7b7",
		spotColor: "#5183b4",
		spotRadius: 5,
		minSpotColor: "#da573b",
		maxSpotColor: "#6fab4a",
		highlightSpotColor: "#f5f",
		highlightLineColor: "#f22",
	} );
	//document.querySelector( "textarea" ).innerHTML = JSON.stringify( history, null, 2 );

	var variance = background.getVariance();
	document.querySelector( ".variance" ).classList.toggle( "variance--empty", variance.length <= 1 );
	$( ".variance" ).sparkline( variance, {
		type: "bar",
		barColor: "#6fab4a",
		negBarColor: "#da573b",
		barWidth: "5",
		zeroColor: "#ffffff",
		height: "48px",
		width: "350px"
	} );
	//document.querySelector( "textarea" ).innerHTML = variance.length;
}
