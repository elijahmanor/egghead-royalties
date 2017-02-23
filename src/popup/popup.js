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
			buildGraph();
		}
	} );
}

function getMinimum( values ) {
	var min = Math.min.apply( null, values );
	var max = Math.max.apply( null, values );
	return min - ( ( max - min ) * 0.05 );
}

function buildGraph() {
	var history = background.getHistory();
	history = {
		data: history,
		min: getMinimum( history )
	};
	var variance = background.getVariance();
	var minutes = background.getMinutes();
	//document.querySelector( "textarea" ).innerHTML = JSON.stringify( history, null, 2 );

	Highcharts.setOptions( {
		lang: { thousandsSep: ',' }
	} );
	Highcharts.chart( "container", {
		//         green      blue       red
		colors: [ "#add960", "#009DCF", "#DA573B", "#7798BF", "#aaeeee", "#ff0066", "#eeaaee", "#55BF3B", "#DF5353", "#7798BF", "#aaeeee" ],
		chart: {
			backgroundColor: "#2d2d39",
			plotBorderColor: "#606063",
			zoomType: "xy"
		},
		title: null,
		xAxis: [ {
				crosshair: true,
				labels: { enabled: false }
		}],
		yAxis: [ { // Primary yAxis Variation green
				visible: false,
				title: { enabled: false },
				opposite: true
		}, { // Secondary yAxis Royalties blue
				gridLineWidth: 0,
				visible: false,
				title: { enabled: false },
				min: history.min
		}, { // Tertiary yAxis Minutes red
				gridLineWidth: 0,
				visible: false,
				title: { enabled: false }, 
				opposite: true
		} ],
		tooltip: { shared: true, headerFormat: "" },
		legend: {
			enabled: true,
			itemStyle: { color: "#fff", fontWeight: "normal" },
			itemHoverStyle: { color: "#fff", fontWeight: "bold" }
		},
		series: [ {
				name: "Royalties",
				type: "spline", // "column",
				yAxis: 1,
				marker: { enabled: false },
				data: history.data,
				tooltip: { valuePrefix: "$" }
		}, {
				name: "Minutes",
				type: "spline",
				yAxis: 2,
				data: minutes,
				marker: { enabled: false },
				// dashStyle: "shortdot",
				tooltip: { valueSuffix: " mins" },
				lineWidth: 3
		}, {
				name: "Variation",
				type: "spline",
				dashStyle: "shortdot",
				marker: { enabled: false },
				data: variance,
				tooltip: { valuePrefix: "$" }
		} ]
	});
}
