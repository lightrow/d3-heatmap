import React, { Component } from "react";
import ReactDOM from 'react-dom';
import './index.css';

var d3 = require("d3");

class App extends Component {
  dthree(data) {
    var margin = { top: 10, right: 0, bottom: 150, left: 50 },
      width = 1200 - margin.left - margin.right,
      height = 600 - margin.top - margin.bottom,
      entryWidth = Math.floor(width / (data[data.length - 1].year - data[0].year)),
      actualWidth = entryWidth * (data[data.length - 1].year - data[0].year),
      entryHeight = height / 12,
      colors = [
        "#5284b9",
        "#7099b4",
        "#86a9b5",
        "#a8babe",
        "#b8aca3",
        "#cf9292",
        "#bd7474",
        "#bb5d5d",
        "#b64f4f"
      ],
      buckets = 9,
      monthsLabels = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
      ],
      parseMonth = d3.timeParse("%B"),
      formatMonth = d3.timeFormat("%B"),
      parseMonthTooltip = d3.timeParse("%m"),
      parseYear = d3.timeParse("%Y");


    function prepareMonthTooltip(num) {
      return formatMonth(parseMonthTooltip(num));
    }

    console.log(entryWidth);

    function computeDimensions(selection) {
      var dimensions = null;
      var node = selection.node();

      if (node instanceof SVGElement) {
        dimensions = node.getBBox();
      } else {
        dimensions = node.getBoundingClientRect();
      }
      console.clear();
      console.log(dimensions);
      return dimensions;
    }

    var parsedMonths = [];
    monthsLabels.forEach(entry => {
      parsedMonths.push(parseMonth(entry));
    });

    var months = d3
      .scaleTime()
      .range([height - entryHeight / 2, entryHeight / 2])
      .domain([
        d3.min(parsedMonths, d => { return d; }),
        d3.max(parsedMonths, d => { return d; })
      ]);
    var years = d3
      .scaleTime()
      .range([0, actualWidth])
      .domain(d3.extent(data, function (d) { return parseYear(d.year); }));

    var svg = d3
      .select("#main")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var colorScale = d3
      .scaleQuantile()
      .domain([
        d3.min(data, d => { return d.variance; }),
        d3.max(data, d => { return d.variance; })
      ])
      .range(colors);

    var g = svg
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var tooltip = d3
      .select("#main")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    g
      .append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(years).ticks(d3.timeYear.every(10)))
      .attr("class", "axisWhite");

    g
      .append("g")
      .call(d3.axisLeft(months).tickFormat(formatMonth))
      .attr("class", "axisWhite");

    g.append("g")
      .selectAll("entry")
      .data(data)
      .enter()
      .append("rect")
      .attr("x", d => { return (d.year - data[0].year) * entryWidth; })
      .attr("y", d => { return height - d.month * entryHeight; })
      .attr("class", "entryRect")
      .attr("width", entryWidth + 1) 
      .attr("height", entryHeight + 1)
      .attr("value", d => { return d.variance; })
      .style("fill", colors[4])
      .on("mousemove", function (d) {
        d3.select(this).style("fill", "#5F5F5F");
        tooltip
          .transition()
          .duration(0)
          .style("opacity", 1);
        var xoffset = computeDimensions(tooltip).width / 2;
        var yoffset = computeDimensions(tooltip).height * 1.5;
        tooltip
          .html(
          "<span class='date'>" +
          prepareMonthTooltip(d.month) +
          "&nbsp;" +
          d.year +
          "</span><br><span class='date'>" +
          d.variance +
          "°C</span>"
          )
          .style("left", d3.event.pageX - xoffset + "px")
          .style("top", d3.event.pageY - yoffset + "px");
      })
      .on("mouseout", function (d) {
        d3.select(this).style("fill", d => { return colorScale(d.variance); });
        tooltip
          .transition()
          .duration(250)
          .style("opacity", 0);
      })
      .transition()
      .duration(1000)
      .style("fill", d => { return colorScale(d.variance); });

    var legend = g.selectAll("legend")
      .data((colorScale.quantiles()), (d) => { return d; })
      .enter()
      .append("g")
      .attr("class", "legend");

    legend.append("rect")
      .attr("x", (d, i) => { return actualWidth - entryHeight * (colors.length - 1) + entryHeight * i; })
      .attr("y", height + 40)
      .attr("width", entryHeight)
      .attr("height", entryHeight / 2)
      .style("fill", (d, i) => { return colors[i]; });

    legend.append("text")
      .attr("class", "legendText")
      .text((d) => { return "≥ " + Math.round(d); })
      .attr("x", (d, i) => { return actualWidth - entryHeight * (colors.length - 1) + entryHeight * i + entryHeight / 2; })
      .attr("y", height + 75);


  }

  componentDidMount() {
    var data = null;
    fetch(
      "https://raw.githubusercontent.com/FreeCodeCamp/ProjectReferenceData/master/global-temperature.json"
    )
      .then(response => response.json())
      .then(responseJson => this.dthree(responseJson.monthlyVariance));
  }

  render() {
    return (
      <div id="main">
        <div id="title">
          Monthly Global Temperature
        </div>
        <div id="description">
          Temperatures are in Celsius and reported as anomalies relative to the Jan 1951-Dec 1980 average.
          <br/>
          Estimated Jan 1951-Dec 1980 absolute temperature °C: <b>8.66 +/- 0.07</b>
        </div>
          <div id="chart" />
      </div>
      );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));

