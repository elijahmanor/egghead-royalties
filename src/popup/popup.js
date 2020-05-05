var background = chrome.extension.getBackgroundPage();

document.addEventListener("DOMContentLoaded", function() {
  refresh();

  document.querySelector(".options").addEventListener("click", function() {
    chrome.runtime.openOptionsPage();
  });

  const chartToggle = document.querySelector(".Popup-chartToggle");
  if (localStorage["graph"] === "true") {
    chartToggle.removeAttribute("hidden");
  }
  chartToggle.addEventListener("click", function(e) {
    const toggle = e.target;

    if (toggle.dataset.type === "bar") {
      toggle.title = "Switch to line chart";
      toggle.classList.remove("fa-bar-chart");
      toggle.classList.add("fa-line-chart");
      toggle.dataset.type = "line";
      buildChart("Bar");
    } else {
      toggle.title = "Switch to bar chart";
      toggle.classList.remove("fa-line-chart");
      toggle.classList.add("fa-bar-chart");
      toggle.dataset.type = "bar";
      buildChart("Line");
    }
  });
});

function refresh() {
  background.getRoyalties(function(royalties) {
    document.documentElement.classList.remove("loading");
    if (royalties.error) {
      document.getElementById("popup").innerHTML = royalties.error;
      return;
    }
    const currency = royalties.revenue.toLocaleString("en-US", {
      style: "currency",
      currency: "USD"
    });
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    let today = getHistory(todayDate.getTime());
    console.log( "today", today );
    today = {
      revenue: today[today.length - 1].revenue - today[0].revenue,
      minutes: today[today.length - 1].minutes - today[0].minutes,
      today
    };

    const yesterdayDate = new Date();
    yesterdayDate.setHours(0, 0, 0, 0);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    let yesterday = getHistory(yesterdayDate.getTime(), todayDate.getTime());
    console.log( "yesterday", yesterday );
    if ( yesterday.length ) {
      yesterday = {
        revenue: yesterday[yesterday.length - 1].revenue - yesterday[0].revenue,
        minutes: yesterday[yesterday.length - 1].minutes - yesterday[0].minutes,
        yesterday
      };  
    } else {
      yesterday = {
        revenue: 0,
        minutes: 0,
        yesterday
      };  
    }

    console.log({ royalties, today, yesterday });

    const previousMonths = royalties.months.reduce(
      function(memo, month, index, array) {
        if (index !== array.length - 1) {
          memo.minutes += month.minutes_watched;
          memo.revenue += month.revenue;
        }
        return memo;
      },
      { minutes: 0, revenue: 0 }
    );
    const classes =
      localStorage["blurValues"] === "true" ? "Egghead--blur" : "";
    const markup = `
<div class="Egghead ${classes}">
  <div class="Egghead-profile">
    <img class="Egghead-avatar" src="${royalties.avatar_url}" />
    <h1 class="Egghead-name">${royalties.full_name}</h1>
  </div>
  <div class="Egghead-stats">
    <h3 class="Egghead-header">Estimated Royalties</h3>
	<ul class="Egghead-royalties">
      <li class="Egghead-royalty">Today</li>
      <li><i class="fa fa-fw fa-money"></i> <span class="Egghead-currency">${today.revenue.toLocaleString(
        "en-US",
        { style: "currency", currency: "USD" }
      )}</span></li>
      <li><i class="fa fa-fw fa-clock-o"></i> <span class="Egghead-minutes">${today.minutes.toLocaleString()}</span></li>
	</ul>
	<ul class="Egghead-royalties">
      <li class="Egghead-royalty">Yesterday</li>
      <li><i class="fa fa-fw fa-money"></i> <span class="Egghead-currency">${yesterday.revenue.toLocaleString(
        "en-US",
        { style: "currency", currency: "USD" }
      )}</span></li>
      <li><i class="fa fa-fw fa-clock-o"></i> <span class="Egghead-minutes">${yesterday.minutes.toLocaleString()}</span></li>
	</ul>
	<ul class="Egghead-royalties">
      <li class="Egghead-royalty">Month</li>
      <li><i class="fa fa-fw fa-money"></i> <span class="Egghead-currency">${currency}</span></li>
      <li><i class="fa fa-fw fa-clock-o"></i> <span class="Egghead-minutes">${royalties.minutes.toLocaleString()}</span></li>
    </ul>
	<ul class="Egghead-royalties">
      <li class="Egghead-royalty">5 Months</li>
      <li><i class="fa fa-fw fa-money"></i> <span class="Egghead-currency">${previousMonths.revenue.toLocaleString(
        "en-US",
        { style: "currency", currency: "USD" }
      )}</span></li>
      <li><i class="fa fa-fw fa-clock-o"></i> <span class="Egghead-minutes">${previousMonths.minutes.toLocaleString()}</span></li>
    </ul>
  </div>
  <div class="Egghead-lessons">
    <div class="Egghead-lesson">
      <i class="Egghead-lessonType fa fa-fw fa-bullhorn" title="submitted"></i>
      <span class="Egghead-count" title="submitted">${
        royalties.submitted_lessons
      }</span>
    </div>
    <div class="Egghead-lesson">
      <i class="Egghead-lessonType fa fa-fw fa-hand-rock-o" title="claimed"></i>
      <span class="Egghead-count" title="claimed">${
        royalties.claimed_lessons
      }</span>
    </div>
    <div class="Egghead-lesson">
      <i class="Egghead-lessonType fa fa-fw fa-calendar-o" title="pending"></i>
      <span class="Egghead-count" title="pending">${
        royalties.pending_lessons
      }</span>
    </div>
    <div class="Egghead-lesson">
      <i class="Egghead-lessonType fa fa-fw fa-search" title="reviewing"></i>
      <span class="Egghead-count" title="reviewing">${
        royalties.reviewing_lessons
      }</span>
    </div>
    <div class="Egghead-lesson">
      <i class="Egghead-lessonType fa fa-fw fa-thumbs-up" title="approved"></i>
      <span class="Egghead-count" title="approved">${
        royalties.approved_lessons
      }</span>
    </div>
    <div class="Egghead-lesson">
      <i class="Egghead-lessonType fa fa-fw fa-rocket" title="published"></i>
      <span class="Egghead-count" title="published">${
        royalties.published_lessons
      }</span>
    </div>
  </div>
</div>
`;
    document.getElementById("popup").innerHTML = markup;
    if (localStorage["graph"] === "true") {
      buildChart();
    }
  });
}

function getMinimum(values) {
  var min = Math.min.apply(null, values);
  var max = Math.max.apply(null, values);
  return min - (max - min) * 0.05;
}

function getHistory(minDate, maxDate) {
  var history = background.getHistory();

  var historySince = minDate || localStorage["historySince"];
  if (historySince !== "null") {
    historySince = new Date(parseInt(historySince));
    if (maxDate) {
      const historyBefore = new Date(parseInt(maxDate));
      history = history.filter(stamp => {
        const stampDate = new Date(stamp.epoch);
        return stampDate >= historySince && stampDate < historyBefore;
      });
    } else {
      history = history.filter(stamp => new Date(stamp.epoch) >= historySince);
    }
  }

  if (history && history.length) {
    history[0].variation = 0;
  }

  //   history.revenue = {
  //     revenue: history.revenue,
  //     min: getMinimum(history.revenue)
  //   };

  var data = {
    revenue: history.map(item => [new Date(item.epoch), item.revenue]),
    minutes: history.map(item => [new Date(item.epoch), item.minutes]),
    variation: history.map(item => [new Date(item.epoch), item.variation])
  };
  document.querySelector("textarea").innerHTML = JSON.stringify(data, null, 2);

  return history;
}

function buildChart(type = "Line") {
  Highcharts.setOptions({
    lang: { thousandsSep: "," },
    global: { useUTC: false }
  });
  const data =
    type === "Line" ? getHistory() : JSON.parse(localStorage["months"]);
  console.log(data);
  charts[`build${type}Chart`](data);
}

const charts = {
  buildLineChart(history) {
    console.log("buildLineChart", history);
    Highcharts.chart("container", {
      colors: [
        "#add960",
        "#009DCF",
        "#DA573B",
        "#7798BF",
        "#aaeeee",
        "#ff0066",
        "#eeaaee",
        "#55BF3B",
        "#DF5353",
        "#7798BF",
        "#aaeeee"
      ],
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
      xAxis: [
        {
          type: "datetime",
          dateTimeLabelFormats: {
            month: "%e. %b",
            year: "%b",
            hour: "%I %p",
            minute: "%I:%M %p"
          },
          crosshair: true,
          labels: { enabled: true, format: "{value:%b %d}" }
        }
      ],
      yAxis: [
        {
          visible: false,
          title: { enabled: false },
          opposite: true
        },
        {
          gridLineWidth: 0,
          visible: false,
          title: { enabled: false },
          min: history.min
        },
        {
          gridLineWidth: 0,
          visible: false,
          title: { enabled: false },
          opposite: true
        }
      ],
      tooltip: {
        shared: true,
        xDateFormat: "%b %d, %Y %I:%M %p",
        useHTML: true,
        formatter: function() {
          let s = `<b>${new Date(this.x).toLocaleString()}</b>`;
          const classes =
            localStorage["blurValues"] === "true" ? "Egghead-secret" : "";

          this.points.forEach((point, i) => {
            s +=
              '<br/><span style="color:' +
              point.series.color +
              '">\u25CF</span> ' +
              point.series.name +
              ": ";
            s +=
              i === 1
                ? `<span class="${classes}">${point.y.toLocaleString()}</span>`
                : `<span class="${classes}">${point.y.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD"
                  })}</span>`;
          });

          return s;
        }
      },
      legend: {
        enabled: true,
        itemStyle: { color: "#fff", fontWeight: "normal" },
        itemHoverStyle: { color: "#fff", fontWeight: "bold" }
      },
      series: [
        {
          name: "Royalties",
          type: "line", //spline",
          yAxis: 1,
          marker: { enabled: false },
          data: history.map(item => [item.epoch, item.revenue]),
          tooltip: { valuePrefix: "$" }
        },
        {
          name: "Minutes",
          type: "line", //spline",
          yAxis: 2,
          data: history.map(item => [item.epoch, item.minutes]),
          marker: { enabled: false },
          tooltip: { valueSuffix: " mins" },
          lineWidth: 3
        },
        {
          name: "Variation",
          type: "line", //spline",
          // dashStyle: "shortdot",
          marker: { enabled: false },
          data: history.map(item => [item.epoch, item.variation]),
          tooltip: { valuePrefix: "$" }
        }
      ]
    });
  },
  buildBarChart(history) {
    Highcharts.chart("container", {
      colors: [
        "#add960",
        "#009DCF",
        "#DA573B",
        "#7798BF",
        "#aaeeee",
        "#ff0066",
        "#eeaaee",
        "#55BF3B",
        "#DF5353",
        "#7798BF",
        "#aaeeee"
      ],
      chart: {
        type: "column",
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
      xAxis: {
        categories: history.map(item => moment(item.month).toDate()),
        type: "datetime",
        dateTimeLabelFormats: {
          month: "%b %Y",
          week: "%b %Y",
          year: "%b %Y",
          hour: "%b %Y",
          minute: "%b %Y"
        },
        crosshair: true,
        labels: { enabled: true, format: "{value:%b %Y}" }
      },
      yAxis: [
        {
          min: 0,
          title: { enabled: false },
          visible: false
        },
        {
          min: 0,
          title: { enabled: false },
          visible: false
        }
      ],
      tooltip: {
        shared: true,
        xDateFormat: "%b %d, %Y %I:%M %p",
        useHTML: true,
        formatter: function() {
          let s = `<b>${moment(this.x).format("MMM YYYY")}</b>`;
          const classes =
            localStorage["blurValues"] === "true" ? "Egghead-secret" : "";

          this.points.forEach((point, i) => {
            s +=
              '<br/><span style="color:' +
              point.series.color +
              '">\u25CF</span> ' +
              point.series.name +
              ": ";
            s +=
              i === 1
                ? `<span class="${classes}">${point.y.toLocaleString()}</span>`
                : `<span class="${classes}">${point.y.toLocaleString("en-US", {
                    style: "currency",
                    currency: "USD"
                  })}</span>`;
          });

          return s;
        }
      },
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0
        }
      },
      legend: {
        enabled: true,
        itemStyle: { color: "#fff", fontWeight: "normal" },
        itemHoverStyle: { color: "#fff", fontWeight: "bold" }
      },
      series: [
        {
          name: "Revenue",
          data: history.map(item => item.revenue)
        },
        {
          name: "Minutes",
          data: history.map(item => item.minutes_watched)
        }
      ]
    });
  }
};
