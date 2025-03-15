import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3'
import { Moon, Sun } from 'lucide-react';
import { CovidData, FilterType, SortType } from '../types/covid';

interface Props {
  data: CovidData[];
}

const CovidChart: React.FC<Props> = ({ data }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [sortType, setSortType] = useState<SortType>('desc');
  const [continentFilter, setContinentFilter] = useState<FilterType>('all');

  const margin = { top: 20, right: 30, bottom: 60, left: 80 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  const continents = Array.from(new Set(data.map(d => d.continent)));

  const filteredData = data
    .filter(d => continentFilter === 'all' || d.continent === continentFilter)
    .sort((a, b) => 
      sortType === 'desc' ? b.cases - a.cases : a.cases - b.cases
    );

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleBand()
      .range([0, width])
      .domain(filteredData.map(d => d.country))
      .padding(0.2);

    const y = d3.scaleLinear()
      .range([height, 0])
      .domain([0, d3.max(filteredData, d => d.cases) || 0]);

    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size","13px")
      .attr("fill", isDarkMode ? "#fff" : "#000");

    svg.append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => d3.format(".2s")(d as number)))
      .selectAll("text")
      .style("font-size","13px")
      .attr("fill", isDarkMode ? "#fff" : "#000");

    // Tooltip
    const tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", isDarkMode ? "#374151" : "#fff")
      .style("border", "2px solid #000")
      .style("border-radius", "5px")
      .style("padding", "10px")
      .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)")
      .style("font-size", "16px")
      .style("color", isDarkMode ? "#fff" : "#000");

    // Bars
    svg.selectAll("rect")
    .data(filteredData)
    .enter()
    .append("rect")
    .attr("x", d => x(d.country) || 0)
    .attr("y", height)
    .attr("width", x.bandwidth())
    .attr("height", 0)
    .attr("fill", d => d.country === selectedCountry ? "#EC8305" : (isDarkMode ? "#6B7280" : "#93C5FD"))
    .attr("rx", 6) // Rounded corners
    .transition()
    .duration(1000)
    .attr("y", d => y(d.cases))
    .attr("height", d => {
      const barHeight = height - y(d.cases);
      return barHeight; // Keep original height
    })
    .attr("ry", d => Math.min(6, height - y(d.cases))); // Only round top
    // Add events
    svg.selectAll("rect")
    .on("mouseover", (event, d) => {
      const data = d as CovidData;
      d3.select(event.currentTarget) // Change fill color on hover
      .transition()
      .duration(200)
      .attr("fill", "#FFBD73");  // Explicit type assertion
  
      tooltip
        .style("visibility", "visible")
        .html(`
          <strong>${data.country}</strong><br/>
          Cases: ${d3.format(",")(data.cases)}<br/>
          Deaths: ${d3.format(",")(data.deaths)}<br/>
          Recovered: ${d3.format(",")(data.recovered)}
        `);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("top", (event.pageY - 10) + "px")
        .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", (event,d) => {
        const data = d as CovidData;
        d3.select(event.currentTarget) // Restore original color on hover out
        .transition()
        .duration(200)
        .attr("fill",  data.country === selectedCountry ? "#EC8305" : (isDarkMode ? "#6B7280" : "#93C5FD"));
      tooltip.style("visibility", "hidden");
    })
    .on("click", (_, d) => {
      const data = d as CovidData; // Explicit type assertion
      setSelectedCountry((prev) => (prev === data.country ? null : data.country));
    });
  

    // Axes labels
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom)
      .text("Countries")
      .attr("fill", isDarkMode ? "#fff" : "#000");

    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + 20)
      .attr("x", -height / 2)
      .text("Total Cases")
      .attr("fill", isDarkMode ? "#fff" : "#000");

    return () => {
      tooltip.remove();
    };
  }, [filteredData, isDarkMode, selectedCountry, width, height]);

  return (
    <div className={`flex-col justify-center p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="flex justify-between items-center mb-6">
        <div className="space-x-4">
          <select
            className={`px-4 py-2 rounded cursor-pointer ${
              isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
            }`}
            value={continentFilter}
            onChange={(e) => setContinentFilter(e.target.value)}
          >
            <option value="all">All Continents</option>
            {continents.map(continent => (
              <option key={continent} value={continent}>{continent}</option>
            ))}
          </select>
          <button
            className={`px-4 py-2 cursor-pointer rounded ${
              isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'
            }`}
            onClick={() => setSortType(prev => prev === 'desc' ? 'asc' : 'desc')}
          >
            Sort {sortType === 'desc' ? '↓' : '↑'}
          </button>
        </div>
        <button
          className={`p-2 rounded-full cursor-pointer ${
            isDarkMode ? 'bg-gray-700 text-yellow-400' : 'bg-gray-100 text-gray-900'
          }`}
          onClick={() => setIsDarkMode(prev => !prev)}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
      <div className="overflow-x-auto ">
        <svg
          ref={svgRef}
          className="w-full"
          style={{ minWidth: '800px',
            
           }}
        />
      </div>
    </div>
  );
};

export default CovidChart;