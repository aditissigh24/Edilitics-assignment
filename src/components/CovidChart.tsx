import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { Moon, Sun } from 'lucide-react';
import { CovidData, FilterType, SortType } from '../types/covid';

interface Props {
  data: CovidData[];
}

const CovidChart: React.FC<Props> = ({ data }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [sortType, setSortType] = useState<SortType>('desc');
  const [continentFilter, setContinentFilter] = useState<FilterType>('all');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const margin = { 
    top: 20, 
    right: window.innerWidth < 640 ? 20 : 30, 
    bottom: window.innerWidth < 640 ? 80 : 60, 
    left: window.innerWidth < 640 ? 60 : 80 
  };

  const continents = Array.from(new Set(data.map(d => d.continent)));

  const filteredData = data
    .filter(d => continentFilter === 'all' || d.continent === continentFilter)
    .sort((a, b) => 
      sortType === 'desc' ? b.cases - a.cases : a.cases - b.cases
    );

  const updateDimensions = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const isMobile = window.innerWidth < 640;
      
      setDimensions({
        width: Math.max(containerWidth - margin.left - margin.right, isMobile ? 260 : 300),
        height: Math.min(
          isMobile ? containerWidth * 0.7 : containerWidth * 0.5,
          isMobile ? 400 : 500
        ) - margin.top - margin.bottom
      });
    }
  }, [margin.left, margin.right]);

  useEffect(() => {
    updateDimensions();
    const handleResize = () => {
      updateDimensions();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateDimensions]);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    const isMobile = window.innerWidth < 640;
    
    // Clear previous content
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", dimensions.width + margin.left + margin.right)
      .attr("height", dimensions.height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleBand()
      .range([0, dimensions.width])
      .domain(filteredData.map(d => d.country))
      .padding(isMobile ? 0.1 : 0.2);

    const y = d3.scaleLinear()
      .range([dimensions.height, 0])
      .domain([0, d3.max(filteredData, d => d.cases) || 0]);

    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${dimensions.height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end")
      .style("font-size", `${isMobile ? 10 : Math.max(10, Math.min(13, dimensions.width / 50))}px`)
      .attr("fill", isDarkMode ? "#fff" : "#000");

    svg.append("g")
      .call(d3.axisLeft(y)
        .ticks(isMobile ? 5 : 8)
        .tickFormat(d => d3.format(".2s")(d as number)))
      .selectAll("text")
      .style("font-size", `${isMobile ? 10 : Math.max(10, Math.min(13, dimensions.width / 50))}px`)
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
      .style("font-size", isMobile ? "12px" : "14px")
      .style("color", isDarkMode ? "#fff" : "#000")
      .style("z-index", "1000")
      .style("pointer-events", "none");

    // Bars
    svg.selectAll("rect")
      .data(filteredData)
      .enter()
      .append("rect")
      .attr("x", d => x(d.country) || 0)
      .attr("y", dimensions.height)
      .attr("width", x.bandwidth())
      .attr("height", 0)
      .attr("fill", d => d.country === selectedCountry ? "#EC8305" : (isDarkMode ? "#6B7280" : "#93C5FD"))
      .attr("rx", isMobile ? 4 : 6)
      .transition()
      .duration(1000)
      .attr("y", d => y(d.cases))
      .attr("height", d => dimensions.height - y(d.cases))
      .attr("ry", d => Math.min(isMobile ? 4 : 6, dimensions.height - y(d.cases)));

    // Add events
    const handleTouch = (event: any, d: any) => {
      const data = d as CovidData;
      const touch = event.touches ? event.touches[0] : event;
      const tooltipWidth = tooltip.node()?.getBoundingClientRect().width || 0;
      
      const xPos = touch.pageX + tooltipWidth > window.innerWidth
        ? touch.pageX - tooltipWidth - 10
        : touch.pageX + 10;

      const yPos = touch.pageY - 70; // Position above finger for better visibility

      tooltip
        .style("visibility", "visible")
        .style("top", `${yPos}px`)
        .style("left", `${xPos}px`)
        .html(`
          <strong>${data.country}</strong><br/>
          Cases: ${d3.format(",")(data.cases)}<br/>
          Deaths: ${d3.format(",")(data.deaths)}<br/>
          Recovered: ${d3.format(",")(data.recovered)}
        `);
    };

    svg.selectAll("rect")
      .on("mouseover touchstart", (event, d) => {
        const data = d as CovidData;
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr("fill", "#FFBD73");

        if (event.type === "touchstart") {
          handleTouch(event, data);
        } else {
          tooltip
            .style("visibility", "visible")
            .html(`
              <strong>${data.country}</strong><br/>
              Cases: ${d3.format(",")(data.cases)}<br/>
              Deaths: ${d3.format(",")(data.deaths)}<br/>
              Recovered: ${d3.format(",")(data.recovered)}
            `);
        }
      })
      .on("mousemove", (event) => {
        if (event.type !== "touchmove") {
          const tooltipWidth = tooltip.node()?.getBoundingClientRect().width || 0;
          const xPos = event.pageX + tooltipWidth > window.innerWidth
            ? event.pageX - tooltipWidth - 10
            : event.pageX + 10;
          
          tooltip
            .style("top", (event.pageY - 10) + "px")
            .style("left", xPos + "px");
        }
      })
      .on("mouseout touchend", (event, d) => {
        const data = d as CovidData;
        d3.select(event.currentTarget)
          .transition()
          .duration(200)
          .attr("fill", data.country === selectedCountry ? "#EC8305" : (isDarkMode ? "#6B7280" : "#93C5FD"));
        tooltip.style("visibility", "hidden");
      })
      .on("click", (_, d) => {
        const data = d as CovidData;
        setSelectedCountry((prev) => (prev === data.country ? null : data.country));
      });

    // Axes labels
    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("x", dimensions.width / 2)
      .attr("y", dimensions.height + (isMobile ? margin.bottom - 15 : margin.bottom - 10))
      .text("Countries")
      .attr("fill", isDarkMode ? "#fff" : "#000")
      .style("font-size", `${isMobile ? 11 : Math.max(12, Math.min(14, dimensions.width / 50))}px`);

    svg.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left + (isMobile ? 15 : 20))
      .attr("x", -dimensions.height / 2)
      .text("Total Cases")
      .attr("fill", isDarkMode ? "#fff" : "#000")
      .style("font-size", `${isMobile ? 11 : Math.max(12, Math.min(14, dimensions.width / 50))}px`);

    return () => {
      tooltip.remove();
    };
  }, [filteredData, isDarkMode, selectedCountry, dimensions, margin.bottom, margin.left]);

  return (
    <div className={`flex-col justify-center p-4 sm:p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <select
            className={`px-4 py-2 rounded cursor-pointer w-full sm:w-auto text-sm sm:text-base ${
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
            className={`px-4 py-2 cursor-pointer rounded w-full sm:w-auto text-sm sm:text-base ${
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
      <div ref={containerRef} className="w-full overflow-x-auto">
        <svg
          ref={svgRef}
          className="w-full"
          style={{
            minWidth: window.innerWidth < 640 ? '260px' : '300px',
            touchAction: 'pan-y pinch-zoom',
          }}
        />
      </div>
    </div>
  );
};

export default CovidChart;