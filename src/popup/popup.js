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
		const classes = localStorage[ "blurValues" ] === "true" ? "Egghead--blur" : "";
		const markup =
`
<div class="Egghead ${ classes }">
  <div class="Egghead-profile">
    <img class="Egghead-avatar" src="${ royalties.avatar_url }" />
    <h1 class="Egghead-name">${ royalties.full_name }</h1>
  </div>
  <div class="Egghead-stats">
    <h3 class="Egghead-header">Estimated royalties</h3>
    <ul class="Egghead-royalties">
      <li><i class="fa fa-fw fa-money"></i> <span class="Egghead-currency">${ currency }</span></li>
      <li><i class="fa fa-fw fa-clock-o"></i> <span class="Egghead-minutes">${ royalties.minutes.toLocaleString() }</span> mins watched</li>
    </ul>
    <h3 class="Egghead-header">Previous 5 months</h3>
    <ul class="Egghead-royalties">
      <li><i class="fa fa-fw fa-money"></i> <span class="Egghead-currency">${ previousMonths.revenue.toLocaleString( "en-US", { style: "currency", currency: "USD" } ) }</span></li>
      <li><i class="fa fa-fw fa-clock-o"></i> <span class="Egghead-minutes">${ previousMonths.minutes.toLocaleString() }</span> mins watched</li>
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

	var historySince = localStorage[ "historySince" ];
	if ( historySince !== "null" ) {
		historySince = new Date( parseInt( historySince ) );
		history = history.filter( stamp => new Date( stamp.epoch ) >= historySince );
	}

	if ( history && history.length ) {
		history[ 0 ].variation = 0;
	}

	history.revenue = {
		revenue: history.revenue,
		min: getMinimum( history.revenue )
	};

	var data = {
		revenue: history.map( item => ([ new Date(item.epoch), item.revenue ]) ),
		minutes: history.map( item => ([ new Date(item.epoch), item.minutes ]) ),
		variation: history.map( item => ([ new Date(item.epoch), item.variation ]) )
	};
	document.querySelector( "textarea" ).innerHTML = JSON.stringify( data, null, 2 );

	Highcharts.setOptions( {
		lang: { thousandsSep: "," },
		global: { useUTC: false }
	} );
	Highcharts.chart( "container", {
		colors: [ "#add960", "#009DCF", "#DA573B", "#7798BF", "#aaeeee", "#ff0066", "#eeaaee", "#55BF3B", "#DF5353", "#7798BF", "#aaeeee" ],
		chart: {
			backgroundColor: "#2d2d39",
			plotBorderColor: "#606063",
			zoomType: "x",
			resetZoomButton: {
					position: {
							align: "left",
							verticalAlign: "bottom",
							x: 10,
							y: -75
					},
					relativeTo: "chart"
			}
		},
		title: null,
		xAxis: [ {
				type: "datetime",
				dateTimeLabelFormats: {
						month: "%e. %b",
						year: "%b",
						hour: "%I %p",
						minute: "%I:%M %p"
				},
				crosshair: true,
				labels: { enabled: true, format: "{value:%b %d}" }
		} ],
		yAxis: [ {
				visible: false,
				title: { enabled: false },
				opposite: true
		}, {
				gridLineWidth: 0,
				visible: false,
				title: { enabled: false },
				min: history.min
		}, {
				gridLineWidth: 0,
				visible: false,
				title: { enabled: false }, 
				opposite: true
		} ],
		tooltip: {
			shared: true,
			xDateFormat: "%b %d, %Y %I:%M %p",
			useHTML: true,
			formatter: function() {
				let s = `<b>${ ( new Date( this.x ) ).toLocaleString() }</b>`;
				const classes = localStorage[ "blurValues" ] === "true" ? "Egghead-secret" : "";

				this.points.forEach( ( point, i ) => {
					s += '<br/><span style="color:' + point.series.color + '">\u25CF</span> ' + point.series.name + ": ";
					s += ( i === 1 ) ?
						`<span class="${ classes }">${ point.y.toLocaleString() }</span>` :
						`<span class="${ classes }">${ point.y.toLocaleString( "en-US", { style: "currency", currency: "USD" } ) }</span>`;
				} );

				return s;
			},
		}, 
		legend: {
			enabled: true,
			itemStyle: { color: "#fff", fontWeight: "normal" },
			itemHoverStyle: { color: "#fff", fontWeight: "bold" }
		},
		series: [ {
				name: "Royalties",
				type: "line", //spline",
				yAxis: 1,
				marker: { enabled: false },
				data: history.map( item => [ item.epoch, item.revenue ] ),
				tooltip: { valuePrefix: "$" }
		}, {
				name: "Minutes",
				type: "line", //spline",
				yAxis: 2,
				data: history.map( item => [ item.epoch, item.minutes ] ),
				marker: { enabled: false },
				tooltip: { valueSuffix: " mins" },
				lineWidth: 3
		}, {
				name: "Variation",
				type: "line", //spline",
				// dashStyle: "shortdot",
				marker: { enabled: false },
				data: history.map( item => [ item.epoch, item.variation ] ),
				tooltip: { valuePrefix: "$" }
		} ]
	});
}
