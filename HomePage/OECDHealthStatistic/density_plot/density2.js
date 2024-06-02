// 

function density() {
    const margin = { top: 30, right: 30, bottom: 40, left: 50 },
        width = 500 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#density")
        .html("")  // Clear any previous content
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    let lastClickedCountry = null;  // Store the last clicked country
    let currentDataType = 'lifeExpectancy';  // Store the current data type

    // Load and merge data from the three CSV files
    Promise.all([
        d3.csv("../Processed_Data/Life_expectancy.csv"),
        d3.csv("../Processed_Data/GDP_processed.csv"),
        d3.csv("../Processed_Data/GDP_capita_processed.csv")
    ]).then(function(files) {

        // Update chart when year slider changes
        var slider = document.getElementById('yearSlider');
        let year = slider.value;
        slider.addEventListener('input', function() {
            year = slider.value;
            document.getElementById("leYear").innerHTML = year;
            updateChart(mergedData, lastClickedCountry, year, currentDataType); // Use current data type
        });

        let lifeExpectancyData = files[0];
        let gdpData = files[1];
        let gdpCapitaData = files[2];

        // Merge the data on Country_code and Year
        let mergedData = lifeExpectancyData.map(d => {
            let gdpMatch = gdpData.find(g => g.Country_code === d.Country_code && g.Year === d.Year);
            let gdpCapitaMatch = gdpCapitaData.find(gc => gc.Country_code === d.Country_code && gc.Year === d.Year);
            return {
                Country_code: d.Country_code,
                Country: d.Country,
                Year: d.Year,
                lifeExpectancy: +d.Value,
                GDP: gdpMatch ? +gdpMatch.GDP : null,
                GDP_capita: gdpCapitaMatch ? +gdpCapitaMatch.Value : null
            };
        });

        var x = d3.scaleLinear()
            .range([0, width]);

        var y = d3.scaleLinear()
            .range([height, 0]);

        var xAxis = svg.append("g")
            .attr("transform", `translate(0, ${height})`);

        var yAxis = svg.append("g");

        var xAxisLabel = svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + 30)
            .style("text-anchor", "middle");

        var yAxisLabel = svg.append("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 15)
            .attr("x", -margin.top - 80);

        function updateChart(data, country, year, dataType) {
            const filteredData = data.filter(d => d.Year == year && (!country || d.Country_code == country)).map(d => +d[dataType]);
            console.log(`Filtered Data for ${dataType} in ${year} ${country ? 'for ' + country : 'for all countries'}`, filteredData);
            
            if (filteredData.length === 0) {
                svg.selectAll(".no-data").remove();  // Remove any existing no data text
                svg.append("text")
                    .attr("class", "no-data")
                    .attr("x", width / 2)
                    .attr("y", height / 2)
                    .attr("text-anchor", "middle")
                    .style("fill", "red")
                    .text("No data available");
                return;
            }

            svg.selectAll(".no-data").remove();  // Remove any existing no data text

            let xDomain, xLabel, yDomain;
            if (dataType === "lifeExpectancy") {
                xDomain = [0, 100];
                xLabel = "Life Expectancy (Years)";
                yDomain = [0, 0.10];  
            } else if (dataType === "GDP") {
                xDomain = [0, d3.max(data, d => d.GDP)];
                xLabel = "GDP";
                yDomain = [0, 0.0001];  
            } else {
                xDomain = [0, d3.max(data, d => d.GDP_capita)];
                xLabel = "GDP per Capita";
                yDomain = [0, 0.0001]; 
            }

            console.log(`xDomain: ${xDomain}`);

            x.domain(xDomain).nice();

            // Calculate density
            const kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(40));
            const density = kde(filteredData);

            y.domain(yDomain).nice();
            console.log(`yDomain: ${y.domain()}`);

            xAxis.transition().duration(1000).call(d3.axisBottom(x));
            yAxis.transition().duration(1000).call(d3.axisLeft(y));

            xAxisLabel.text(xLabel);
            yAxisLabel.text("Density");

            // Remove existing paths
            svg.selectAll("path").remove();

            svg.append("path")
                .datum(density)
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

        updateChart(mergedData, null, year, currentDataType);  // Initial chart with default year and Life Expectancy data

        function computeStatistics(values) {
            const mean = d3.mean(values);
            const stddev = d3.deviation(values);
            return { mean, stddev };
        }

        function addStatistics(svg, statistics, x) {
            svg.selectAll(".statistics").remove(); // Remove old statistics elements

            svg.append("line")
                .attr("class", "statistics")
                .attr("x1", x(statistics.mean))
                .attr("x2", x(statistics.mean))
                .attr("y1", y(0))
                .attr("y2", y(y.domain()[1]))
                .attr("stroke", "red")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "4");

            svg.append("text")
                .attr("class", "statistics")
                .attr("x", x(statistics.mean))
                .attr("y", y(y.domain()[1]) - 10)
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

        // Listen for the custom event 'countryClick'
        document.addEventListener('countryClick', function(event) {
            const { year, code, country } = event.detail;
            document.getElementById("country").innerHTML = country;
            console.log(country)
            lastClickedCountry = code;  // Update the last clicked country
            updateChart(mergedData, code, year, currentDataType); // Use current data type
        });

        // Update chart when data type changes
        document.getElementById("dataType").addEventListener("change", function() {
            const selectedYear = document.getElementById("yearSlider").value;
            currentDataType = this.value; // Update current data type
            updateChart(mergedData, lastClickedCountry, selectedYear, currentDataType);
        });
    });
}

window.onload = density;
