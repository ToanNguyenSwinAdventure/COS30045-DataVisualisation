// function density() {
//     const margin = { top: 30, right: 30, bottom: 40, left: 50 },
//         width = 500 - margin.left - margin.right,
//         height = 400 - margin.top - margin.bottom;

//     let lastClickedCountry = null;  // Store the last clicked country

//     const svg = d3.select("#density")
//         .html("")  // Clear any previous content
//         .append("svg")
//         .attr("width", width + margin.left + margin.right)
//         .attr("height", height + margin.top + margin.bottom)
//         .append("g")
//         .attr("transform", `translate(${margin.left},${margin.top})`);

    
//     d3.csv("../Processed_Data/Life_expectancy.csv").then(function (data) {
        
//         var x = d3.scaleLinear()
//             .domain([0, 100])
//             .range([0, width]);

//         svg.append("g")
//             .attr("transform", `translate(0, ${height})`)
//             .call(d3.axisBottom(x));

//         var y = d3.scaleLinear()
//             .range([height, 0])
//             .domain([0, 0.1]);

//         svg.append("g")
//             .call(d3.axisLeft(y));

//         function updateChart(data, country, year) {
//             const filteredData = data.filter(d => d.Year == year && (!country || d.Country_code == country)).map(d => +d.Value);
            
//             if (filteredData.length === 0) {
//                 svg.append("text")
//                     .attr("x", width / 2)
//                     .attr("y", height / 2)
//                     .attr("text-anchor", "middle")
//                     .style("fill", "red")
//                     .text("No data available");
//                 return;
//             }

//             const kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(40));
//             const density = kde(filteredData);
//             // Remove existing paths
//             svg.selectAll("path").remove();

//             svg.append("path")
//                 .datum(density)
//                 .attr("fill", "#69b3a2")
//                 .attr("opacity", ".8")
//                 .attr("stroke", "#000")
//                 .attr("stroke-width", 1)
//                 .attr("stroke-linejoin", "round")
//                 .attr("d", d3.line()
//                     .curve(d3.curveBasis)
//                     .x(d => x(d[0]))
//                     .y(d => y(d[1]))
//                 );

//             const stats = computeStatistics(filteredData);
//             addStatistics(svg, stats, x);
//         }

//         updateChart(data, null, 2021);  // Initial chart with default year

//         function computeStatistics(values) {
//             const mean = d3.mean(values);
//             const stddev = d3.deviation(values);
//             return { mean, stddev };
//         }

//         function addStatistics(svg, statistics, x) {
//             svg.selectAll(".statistics").remove(); // Remove old statistics elements

//             svg.append("line")
//                 .attr("class", "statistics")
//                 .attr("x1", x(statistics.mean))
//                 .attr("x2", x(statistics.mean))
//                 .attr("y1", y(0))
//                 .attr("y2", y(0.1))
//                 .attr("stroke", "red")
//                 .attr("stroke-width", 2)
//                 .attr("stroke-dasharray", "4");

//             svg.append("text")
//                 .attr("class", "statistics")
//                 .attr("x", x(statistics.mean))
//                 .attr("y", y(0.1) - 10)
//                 .attr("text-anchor", "middle")
//                 .style("fill", "red")
//                 .text(`Mean: ${statistics.mean.toFixed(2)}`);
//         }

//         function kernelDensityEstimator(kernel, X) {
//             return function (V) {
//                 return X.map(function (x) {
//                     return [x, d3.mean(V, function (v) { return kernel(x - v); })];
//                 });
//             };
//         }

//         function kernelEpanechnikov(k) {
//             return function (v) {
//                 return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
//             };
//         }

//         svg.append("text")
//             .attr("x", width / 2)
//             .attr("y", height + 30)
//             .style("text-anchor", "middle")
//             .text("Life Expectancy (Years)");

//         svg.append("text")
//             .attr("text-anchor", "end")
//             .attr("transform", "rotate(-90)")
//             .attr("y", -margin.left + 15)
//             .attr("x", -margin.top -80)
//             .text("Density");



//         // Listen for the custom event 'countryClick'
//         document.addEventListener('countryClick', function(event) {
//             const { year, code, country } = event.detail;
//             lastClickedCountry = code;  // Update the last clicked country
//             document.getElementById('country').innerHTML = country;
//             updateChart(data, code, year);
//         });

//         // Update chart when year slider changes
//         var slider = document.getElementById('yearSlider');
//         slider.addEventListener('input', function(event) {
//             let year = slider.value;
//             document.getElementById('leYear').innerHTML = year;
//             document.getElementById('country').innerHTML = lastClickedCountry;
//             updateChart(data, lastClickedCountry, year);
//         });

//     });
// }

// window.onload = density;

function density() {
    const margin = { top: 30, right: 30, bottom: 40, left: 50 },
        width = 500 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

    let lastClickedCountry = null;  // Store the last clicked country

    const svg = d3.select("#density")
        .html("")  // Clear any previous content
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    d3.csv("../Processed_Data/Life_expectancy.csv").then(function (lifeData) {
        d3.csv("../Processed_Data/GDP_processed.csv").then(function (gdpData) {
            d3.csv("../Processed_Data/GDP_capita_processed.csv").then(function (gdpCapitaData) {
        
        
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
                var slider = document.getElementById('yearSlider');
                slider.addEventListener('input', function(event) {
                    let year = slider.value;
                    document.getElementById('leYear').innerHTML = year;
                    document.getElementById('country').innerHTML = lastClickedCountry;
                    updateChart(data, lastClickedCountry, year);
                });

        function updateChart(country, year, dataType) {
            svg.selectAll("path").remove(); // Clear previous paths
            svg.selectAll(".no-data").remove(); // Clear previous no data text

            var filteredData
            if(dataType == "Value"){

                filteredData += lifeData.filter(d => d.Year == year && (!country || d.Country_code == country)).map(d => +d.Value);
            }
            else if(dataType == "GDP"){

                filteredData += gdpData.filter(d => d.Year == year && (!country || d.Country_code == country)).map(d => +d.GDP);
            }
            else{
                filteredData += gdpCapitaData.filter(d => d.Year == year && (!country || d.Country_code == country)).map(d => +d.Value);
            }
            console.log("DataTY " + dataType)
            console.log("Life Data" + filteredData)
            
            if (filteredData.length === 0) {
                svg.append("text")
                    .attr("class", "no-data")
                    .attr("x", width / 2)
                    .attr("y", height / 2)
                    .attr("text-anchor", "middle")
                    .style("fill", "red")
                    .text("No data available");
                return;
            }

            const kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(40));
            const density = kde(filteredData);

            svg.selectAll(".no-data").remove();  // Remove any existing no data text

            let xDomain, xLabel, yDomain;
            if (dataType === "lifeExpectancy") {
                xDomain = [0, 100];
                xLabel = "Life Expectancy (Years)";
                yDomain = [0, 0.10];  
            } else if (dataType === "GDP") {
                xDomain = [0, d3.max(gdpData, d => d.GDP) + 100];
                xLabel = "GDP";
                yDomain = [0, 0.10];  
            } else {
                xDomain = [0, d3.max(gdpCapitaData, d => d.Value) + 100];
                xLabel = "GDP per Capita";
                yDomain = [0, 0.10]; 
            }

            console.log(`xDomain: ${xDomain}`);

            x.domain(xDomain).nice();
            y.domain(yDomain).nice();
            console.log(`yDomain: ${y.domain()}`);

            xAxis.transition().duration(1000).call(d3.axisBottom(x));
            yAxis.transition().duration(1000).call(d3.axisLeft(y));

            xAxisLabel.text(xLabel);
            yAxisLabel.text("Density");

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

        updateChart(null, 2021);  // Initial chart with default year

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

        document.addEventListener('countryClick', function(event) {
            const { year, code, country } = event.detail;
            lastClickedCountry = code;  // Update the last clicked country
            document.getElementById('country').innerHTML = country;
            updateChart(code, year);
        });

        // Update chart when data type changes
        document.getElementById("dataType").addEventListener("change", function() {
            const selectedYear = document.getElementById("yearSlider").value;
            currentDataType = this.value; // Update current data type
            updateChart(lastClickedCountry, selectedYear, currentDataType);
        });

    });
});
});
}

window.onload = density;


