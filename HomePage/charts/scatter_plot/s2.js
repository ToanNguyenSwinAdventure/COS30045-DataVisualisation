function scatter_plot() {
    d3.select("#plot").remove();
    d3.select("#density").remove();

    var cfg = {
        w: window.innerWidth / 2.5,
        h: window.innerHeight / 2.5,
        padding: 70,
        radius: 4,
        border: 1
    };

    var continentColor = d3.scaleOrdinal()
        .domain(["Asia", "Europe", "Americas", "Africa", "Oceania"])
        .range(d3.schemeSet1);

    createPlotSection();
    createPlotAxisOption();

    // Create SVG
    var container = d3.select('#plot')
        .append("svg")
        .attr('id', 'plot-container')
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${cfg.w + cfg.padding * 2} ${cfg.h + cfg.padding * 2}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    var svg = container.append("g")
        .attr("transform", `translate(${cfg.padding}, ${cfg.padding})`);

    // Create a tooltip div
    var tooltip = d3.select("#plot")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    var population_scale = d3.scaleSqrt();

    var xScale = d3.scaleLinear();
    var yScale = d3.scaleLinear();

    var x_option = document.getElementById('xAxis_option');
    var y_option = document.getElementById('yAxis_option');

    x_option.addEventListener('input', handleAxisChange);
    y_option.addEventListener('input', handleAxisChange);

    function handleAxisChange(update = false) {
        let x = x_option.value;
        let y = y_option.value;
        if (update == true) {
            console.log("UPDATE");
        } else {
            return [x, y];
        }
    }

    d3.select("#yAxis_option").on("change", function(d) {
        var selectedOption = d3.select(this).property("value");
        update_option_axis(null, selectedOption);
    });
    d3.select("#xAxis_option").on("change", function(d) {
        var selectedOption = d3.select(this).property("value");
        update_option_axis(selectedOption, null);
    });

    draw_chart(null, null);

    var slider = document.getElementById('yearSlider');

    slider.addEventListener('input', function() {
        let year = slider.value;
        get_data_from_year(year).then(function(data){
            updatePlot(data, year);
        });
    });

    function get_data_from_year(year){
        return Promise.all([
            d3.csv("../HomePage/Processed_Data/Life_expectancy.csv"),
            d3.csv("../HomePage/Processed_Data/GDP_processed.csv"),
            d3.csv("../HomePage/Processed_Data/country_continent.csv"),
            d3.csv("../HomePage/Processed_Data/Population.csv"),
            d3.csv("../HomePage/Processed_Data/Health_expenditure.csv"),
        ]).then(function(data){
            var lifeExpectancyData = data[0];
            var gdpData = data[1];
            var continentData = data[2];
            var populationData = data[3];
            var healthExpenditureData = data[4];

            var lifeExpectancy_in_year = lifeExpectancyData.filter(d => d.Year === year);
            var gdp_in_year = gdpData.filter(d => d.Year === year);
            var population_in_year = populationData.filter(d => d.Year === year);
            var healthExpenditureData_in_year = healthExpenditureData.filter(d => d.Year === year);

            var mergedData = lifeExpectancy_in_year.map(d => {
                var gdpMatch = gdp_in_year.find(g => g.Country_code === d.Country_code);
                var continentMatch = continentData.find(c => c.Country_code === d.Country_code);
                var populationMatch = population_in_year.find(p => p.Country_code === d.Country_code);
                var healthExpenditureMatch = healthExpenditureData_in_year.find(p => p.Country_code === d.Country_code);
                return {
                    country: d.Country,
                    lifeExpectancy: +d.Value,
                    gdp: gdpMatch ? +gdpMatch.GDP : null,
                    gdp_capita: gdpMatch ? +gdpMatch.GDP_capita : null,
                    continent: continentMatch ? continentMatch.Continent : null,
                    population: populationMatch ? populationMatch.Population : null,
                    health_expenditure_gdp_share: healthExpenditureMatch ? healthExpenditureMatch.health_expenditure_gdp_share : null,
                    health_expenditure: healthExpenditureMatch ? healthExpenditureMatch.health_expenditure : null,
                    health_expenditure_capita: healthExpenditureMatch ? healthExpenditureMatch.health_expenditure_capita : null,
                };
            }).filter(d => d.gdp_capita !== null);
            // Extract columns from the merged data
            var columns = Object.keys(mergedData[0]);
            mergedData.columns = columns; // Add columns to mergedData for easier access
            var filteredColumns = mergedData.columns.filter(function(column) {
                return column !== 'country' && column !== 'continent' && column !== 'population';
            });
            return mergedData;
        });
    }

    function updatePlot(data, chart_year) {
        var axis_option = handleAxisChange();
        xAxis_option = axis_option[0];
        yAxis_option = axis_option[1];
        var xAxisData = get_data_by_axis(data, xAxis_option);
        var yAxisData = get_data_by_axis(data, yAxis_option);

        xScale
            .domain([d3.min(xAxisData) - 10, d3.max(xAxisData) + 10])
            .range([0, cfg.w - cfg.padding * 2]);
        yScale
            .domain([d3.min(yAxisData) - 10, d3.max(yAxisData) + 10])
            .range([cfg.h - cfg.padding * 2, 0]);

        var xAxis = d3.axisBottom(xScale).ticks(7);
        var yAxis = d3.axisLeft(yScale).ticks(7);

        svg.select(".x-axis").transition().duration(300).call(xAxis);
        svg.select(".y-axis").transition().duration(300).call(yAxis);

        var circles = svg.selectAll("circle")
            .data(data);

        circles.enter()
            .append("circle")
            .merge(circles)
            .transition().duration(300)
            .attr("cx", d => xScale(d[xAxis_option]))
            .attr("cy", d => yScale(d[yAxis_option]))
            .attr("r", d => population_scale(d.population))
            .attr("stroke", "black");

        circles.exit().remove();

        svg.select("#chart-year").remove();
        svg.append("text")
            .attr("x", cfg.w / 2)
            .attr("y", cfg.padding / 2)
            .attr("id", "chart-year")
            .style("text-anchor", "middle")
            .style("font-size", "12px") // Smaller font size
            .text(title_name(xAxis_option, yAxis_option, chart_year));
    }

    function axis_name(axis) {
        if (axis == 'gdp') {
            return "GDP (Billions $US)";
        } else if (axis == 'gdp_capita') {
            return "GDP per Capita $US";
        } else if (axis == 'lifeExpectancy') {
            return "Life Expectancy (year)";
        } else if (axis == 'health_expenditure_gdp_share') {
            return "Health Expenditure of GDP Share";
        } else if (axis == 'health_expenditure') {
            return "Health Expenditure";
        } else if (axis == 'health_expenditure_capita') {
            return "Health Expenditure per Capita $US";
        } else {
            return "Axis";
        }
    }

    function title_name(xAxis, yAxis, year) {
        return `${axis_name(xAxis)} vs ${axis_name(yAxis)} in ${year}`;
    }

    function handleMouseOver(event, d) {
        var tooltipContent = `<div><strong>Country:</strong> ${d.country}</div>
            <div><strong>Life Expectancy:</strong> ${d.lifeExpectancy} years</div>
            <div><strong>GDP/Capita:</strong> ${d.gdp_capita} $US</div>
            <div><strong>GDP:</strong> ${d.gdp} Billions $US</div>
            <div><strong>Population:</strong> ${d.population}</div>
            <div><strong>Health Expenditure GDP Share:</strong> ${d.health_expenditure_gdp_share}</div>
            <div><strong>Health Expenditure:</strong> ${d.health_expenditure} Country's currency</div>
            <div><strong>Health Expenditure per Capita:</strong> ${d.health_expenditure_capita} $US</div>
            <div style="font-size:60%"><strong>GDP</strong> & <strong>GDP/capita</strong> are conducted using <strong>Purchasing Power Parity (PPPs)</strong> in $US</div>`;

        tooltip.transition()
            .duration(200)
            .style("opacity", 1);
        tooltip.html(tooltipContent)
            .style("left", (event.pageX + cfg.padding / 5) + "px")
            .style("top", (event.pageY - cfg.h * 3 + cfg.padding / 2) + "px");

        d3.select(this)
            .attr("r", d => population_scale(d.population) + 2);
    }

    function handleMouseOut() {
        tooltip.transition()
            .duration(500)
            .style("opacity", 0);

        d3.select(this)
            .attr("r", d => population_scale(d.population));
        d3.selectAll(".tooltip").remove();
    }

    function get_data_by_axis(data, axis) {
        return data.map(d => d[axis]);
    }

    function filter_null_data(data, keys) {
        return data.filter(row => {
            return keys.every(key => row[key] !== null);
        });
    }

    function draw_chart(x_update, y_update, chart_year = "2021") {
        return get_data_from_year(chart_year).then(function(data) {
            if (x_update == null && y_update == null) {
                var axis_option = handleAxisChange();
                xAxis_option = axis_option[0];
                yAxis_option = axis_option[1];
            } else {
                xAxis_option = x_update;
                yAxis_option = y_update;
            }
            var xAxisData = get_data_by_axis(data, xAxis_option);
            var yAxisData = get_data_by_axis(data, yAxis_option);
            var mergedData = filter_null_data(data, [xAxis_option, yAxis_option]);

            population_scale = d3.scaleSqrt()
                .domain([d3.max(mergedData, d => d.population), d3.min(mergedData, d => d.population)])
                .range([cfg.radius, cfg.radius * 1.01]);

            xScale
                .domain([d3.min(xAxisData) - 10, d3.max(xAxisData) + 10])
                .range([0, cfg.w - cfg.padding * 2]);
            yScale
                .domain([d3.min(yAxisData) - 10, d3.max(yAxisData) + 10])
                .range([cfg.h - cfg.padding * 2, 0]);

            var xAxis = d3.axisBottom(xScale).ticks(7);
            var yAxis = d3.axisLeft(yScale).ticks(7);

            svg.append("g")
                .attr("class", "x-axis")
                .attr("transform", "translate(0, " + (cfg.h - cfg.padding * 2) + ")")
                .call(xAxis);
            svg.append("g")
                .attr("class", "y-axis")
                .call(yAxis);

            svg.append("text")
                .attr("x", (cfg.w - cfg.padding * 2) / 2)
                .attr("y", cfg.h - cfg.padding / 2 + 20)
                .style("text-anchor", "middle")
                .style("font-size", "12px") // Smaller font size
                .text(axis_name(xAxis_option));

            svg.append("text")
                .attr("transform", "rotate(-90)")
                .attr("x", -(cfg.h - cfg.padding * 2) / 2)
                .attr("y", -cfg.padding / 2 - 10)
                .style("text-anchor", "middle")
                .style("font-size", "12px") // Smaller font size
                .text(axis_name(yAxis_option));

            const zoom = d3.zoom()
                .scaleExtent([0.5, 32])
                .on("zoom", zoomed);

            container.call(zoom);

            function zoomed(event) {
                const transform = event.transform;
                const newXScale = transform.rescaleX(xScale);
                const newYScale = transform.rescaleY(yScale);

                var xAxis = d3.axisBottom(newXScale);
                var yAxis = d3.axisLeft(newYScale);

                svg.select(".x-axis").call(xAxis);
                svg.select(".y-axis").call(yAxis);
                svg.selectAll("circle")
                    .attr("cx", d => newXScale(d[xAxis_option]))
                    .attr("cy", d => newYScale(d[yAxis_option]));
            }

            // Title
            svg.append("text")
                .attr("x", (cfg.w - cfg.padding * 2) / 2)
                .attr("y", -cfg.padding / 2)
                .attr("id", "chart-year")
                .style("text-anchor", "middle")
                .style("font-size", "12px") // Smaller font size
                .text(title_name(xAxis_option, yAxis_option, chart_year));

            var highlight = function(event, d) {
                d3.selectAll(".bubbles").style("opacity", .05);
                d3.selectAll("." + d).style("opacity", 1);
            }

            var noHighlight = function(event, d) {
                d3.selectAll(".bubbles").style("opacity", 1);
            }

            var valuesToShow = [10000000, 100000000, 1000000000];

            container.selectAll("legend")
                .data(valuesToShow)
                .enter()
                .append("circle")
                .attr("cx", cfg.w + cfg.padding)
                .attr("cy", d => cfg.h - 80 - population_scale(d))
                .attr("r", d => population_scale(d))
                .style("fill", "none")
                .attr("stroke", "black");

            container.selectAll("legend")
                .data(valuesToShow)
                .enter()
                .append("line")
                .attr('x1', d => cfg.w + cfg.padding + population_scale(d))
                .attr('x2', (d, i) => cfg.w + cfg.padding + 10 * i)
                .attr('y1', d => cfg.h - 80 - population_scale(d))
                .attr('y2', d => cfg.h - 80 - population_scale(d))
                .attr('stroke', 'black')
                .style('stroke-dasharray', ('2,2'));

            container.selectAll("legend")
                .data(valuesToShow)
                .enter()
                .append("text")
                .attr('x', (d, i) => cfg.w + cfg.padding + 10 * i)
                .attr('y', d => cfg.h - 80 - population_scale(d))
                .text(d => d / 1000000)
                .style("font-size", "10px") // Smaller font size
                .attr('alignment-baseline', 'middle');

            container.append("text")
                .attr('x', cfg.w + cfg.padding)
                .attr("y", cfg.h - 50)
                .text("Population (Millions)")
                .attr("text-anchor", "middle")
                .style("font-size", "10px"); // Smaller font size

            var size = 20;
            var allgroups = ["Asia", "Europe", "Americas", "Africa", "Oceania"];

            container.selectAll("myrect")
                .data(allgroups)
                .enter()
                .append("circle")
                .attr("cx", cfg.w + cfg.padding)
                .attr("cy", (d, i) => 10 + i * (size + 5))
                .attr("r", 5) // Smaller radius
                .style("fill", d => continentColor(d))
                .on("mouseover", highlight)
                .on("mouseleave", noHighlight);

            container.selectAll("mylabels")
                .data(allgroups)
                .enter()
                .append("text")
                .attr("x", cfg.w + cfg.padding + 10)
                .attr("y", (d, i) => i * (size + 5) + (size / 2))
                .style("fill", d => continentColor(d))
                .text(d => d)
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")
                .on("mouseover", highlight)
                .on("mouseleave", noHighlight)
                .style("font-size", "10px"); // Smaller font size

            svg.selectAll("circle")
                .data(mergedData)
                .enter()
                .append("circle")
                .attr("class", d => "bubbles " + d.continent)
                .attr("cx", d => xScale(d[xAxis_option]))
                .attr("cy", d => yScale(d[yAxis_option]))
                .on("mouseover", handleMouseOver)
                .on("mouseout", handleMouseOut)
                .attr("r", d => population_scale(d.population))
                .style("fill", d => continentColor(d.continent))
                .attr("stroke", "black")
                .attr("border", 1);
        });
    }

    function update_option_axis(update_x, update_y) {
      
        if (update_x == null) {
            update_x = x_option.value;
        }
        if (update_y == null) {
            update_y = y_option.value;
        }
        d3.select("#plot-svg").remove();
        draw_chart(update_x, update_y);
    }
}

function createPlotAxisOption() {
    var plotOptionDiv = d3.select('#plot')
        .append("div")
        .attr("id", "plot-option");

    plotOptionDiv.append("label")
        .attr("for", "xAxis_option")
        .text("X Axis Option: ")
        .style("font-size", "10px");

    var xAxisSelect = plotOptionDiv.append("select")
        .attr("id", "xAxis_option")
        .attr("name", "xAxis_option")
        .style("font-size", "10px");

    xAxisSelect.append("option")
        .attr("value", "gdp_capita")
        .text("GDP per Capita");

    xAxisSelect.append("option")
        .attr("value", "lifeExpectancy")
        .text("Life Expectancy");

    xAxisSelect.append("option")
        .attr("value", "gdp")
        .text("GDP");

    plotOptionDiv.append("span")
        .html("&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;");

    plotOptionDiv.append("label")
        .attr("for", "yAxis_option")
        .text("Y Axis Option: ")
        .style("font-size", "10px");

    var yAxisSelect = plotOptionDiv.append("select")
        .attr("id", "yAxis_option")
        .attr("name", "yAxis_option")
        .style("font-size", "10px");

    yAxisSelect.append("option")
        .attr("value", "lifeExpectancy")
        .text("Life Expectancy");

    yAxisSelect.append("option")
        .attr("value", "gdp_capita")
        .text("GDP per Capita");

    yAxisSelect.append("option")
        .attr("value", "gdp")
        .text("GDP");
}

function createPlotSection() {
    d3.select("#right-container")
        .append("div")
        .attr("id", "plot");
}
