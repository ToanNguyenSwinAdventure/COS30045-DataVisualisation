const margin = { top: 70, right: 30, bottom: 40, left: 50 },
width = 500 - margin.left - margin.right,
height = 400 - margin.top - margin.bottom;

function density() {

    d3.select("#plot").remove();
    d3.select("#density").remove();
    createDensitySection();
    let lastClickedCountry = null;  // Store the last clicked country

    var container = d3.select('#density')
    .append("svg")
    .attr('id', 'density-container')
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

    var svg = d3.select("#density-container")
    .html("")  // Clear any previous content
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv("../HomePage/Processed_Data/Life_expectancy.csv").then(function (data) {
        //updateChart(data, lastClickedCountry, 2021);
        
        // Listen for the custom event 'countryClick'
        document.addEventListener('countryClick', function(event) {
            const { year, code, country } = event.detail;
            lastClickedCountry = code;  // Update the last clicked country
            document.getElementById('country').textContent = 'for ' + country;
            document.getElementById('leYear').textContent = 'in ' + year;
            updateChart(data, code, year);
        });

        // Update chart when year slider changes
        var slider = document.getElementById('yearSlider');
        slider.addEventListener('input', function(event) {
            let year = slider.value;
            document.getElementById('leYear').textContent = year;
            const countryName = 'for' + lastClickedCountry ? document.querySelector(`#country-list [data-code="${lastClickedCountry}"]`).textContent : "All Countries";
            document.getElementById('country').textContent = countryName;
            updateChart(data, lastClickedCountry, year);
        });
        
  
        var x = d3.scaleLinear()
        .domain([0, 100])
        .range([0, width]);

        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x));

        var y = d3.scaleLinear()
            .range([height, 0])
            .domain([0, 0.1]);
        
        svg.append("g")
            .call(d3.axisLeft(y));

        function updateChart(data, country, year) {
            console.log("Click")
            const filteredData = data.filter(d => d.Year == year && (!country || d.Country_code == country)).map(d => +d.Value);
            
            svg.selectAll(".density-path").remove(); // Remove existing paths
            svg.selectAll(".no-data-text").remove(); // Remove any "No data available" text
            svg.selectAll(".statistics").remove(); // Remove old statistics elements

            if (filteredData.length === 0) {
                svg.append("text")
                    .attr("class", "no-data-text")
                    .attr("x", width / 2)
                    .attr("y", height / 2)
                    .attr("text-anchor", "middle")
                    .style("fill", "red")
                    .text("No data available");
                return;
            }

            const kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(40));
            const density = kde(filteredData);

            svg.append("path")
                .datum(density)
                .attr("class", "density-path")
                .attr("fill", "#69b3a2")
                .attr("opacity", ".8")
                .attr("stroke", "#000")
                .attr("stroke-width", 1)
                .attr("stroke-linejoin", "round")
                .attr("d", d3.line()
                    .curve(d3.curveBasis)
                    .x(d => x(d[0]))
                    .y(d => y(d[1]))
                );

            const stats = computeStatistics(filteredData);
            addStatistics(svg, stats, x);
        }

        updateChart(data, lastClickedCountry, 2021);  // Initial chart with default year

        function computeStatistics(values) {
            const mean = d3.mean(values);
            const stddev = d3.deviation(values);
            return { mean, stddev };
        }

        function addStatistics(svg, statistics, x) {
            svg.append("line")
                .attr("class", "statistics")
                .attr("x1", x(statistics.mean))
                .attr("x2", x(statistics.mean))
                .attr("y1", y(0))
                .attr("y2", y(0.1))
                .attr("stroke", "red")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "4");

            svg.append("text")
                .attr("class", "statistics")
                .attr("x", x(statistics.mean))
                .attr("y", y(0.1) - 10)
                .attr("text-anchor", "middle")
                .style("fill", "red")
                .text(`Mean: ${statistics.mean.toFixed(2)}`);
        }
        
        function kernelDensityEstimator(kernel, X) {
            return function (V) {
                return X.map(function (x) {
                    return [x, d3.mean(V, function (v) { return kernel(x - v); })];
                });
            };
        }

        function kernelEpanechnikov(k) {
            return function (v) {
                return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
            };
        }

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + 30)
            .style("text-anchor", "middle")
            .text("Life Expectancy (Years)");

        svg.append("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 15)
            .attr("x", -margin.top - 80)
            .text("Density");



    });
}
function createDensitySection(){
    var densityChart = d3.select("#right-container")
        .append("div")  
        .attr("id", "density");
    
         // Append main title to the chart
         densityChart.append("text")
         .attr("x", (width + margin.left + margin.right) / 2)  // Center the text horizontally
         .attr("y", -margin.top + 30)  // Position the text vertically
         .style("opacity", 1)
         .style("text-anchor", "middle")
         .style("font-size", "20px")
         .html('Life Expectancy Density <span id="country">for all countries</span> <span id="leYear">in 2021</span>');
  
}
window.onload = density;