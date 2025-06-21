window.renderGraph = function (nodes, links) {

    // Create the SVG container
    console.log("Rendering graph with nodes:", nodes, "and links:", links);

    const svg = d3.select("svg");
    const container = svg.append("g");
    window.d3Container = container; // Expose for external access


    svg.call(d3.zoom().on("zoom", (event) => {
        container.attr("transform", event.transform);
    }));

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Initialize D3 force simulation
    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(width / 2, height / 2));

    // Add links (edges)
    const link = container.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", 2)
        .attr("marker-end", "url(#arrowhead)");

    // Add nodes (vertices)
    const node = container.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("circle")
        .data(nodes)
        .join("circle")
        .attr("r", 10)
        .attr("fill", d => d.id.startsWith('"') ? "orange" : "forestgreen")
        .call(drag(simulation));


    // Add node labels
    const nodeText = container.append("g")
        .selectAll("text")
        .data(nodes)
        .join("text")
        .text(d => d.id.startsWith('_') ? "" : d.id)
        .attr("x", 12)
        .attr("y", ".31em")
        .attr("fill", "white");

    const linkText = container.append("g")
        .selectAll("text")
        .data(links)
        .join("text")
        .text(d => d.predicate)
        .attr("x", 12)
        .attr("y", ".31em")
        .attr("fill", "grey");



    // Update the graph on each simulation tick
    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        node
            .attr("cx", d => d.x)
            .attr("cy", d => d.y);

        nodeText
            .attr("x", d => d.x + 15)
            .attr("y", d => d.y + 3);

        linkText
            .attr("x", d => (d.source.x + d.target.x) / 2)
            .attr("y", d => (d.source.y + d.target.y) / 2);
    });

    // Drag behavior for nodes
    function drag(simulation) {
        function dragstarted(event) {
            if (!event.active) { simulation.alphaTarget(0.3).restart(); }
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) { simulation.alphaTarget(0); }
            event.subject.fx = null;
            event.subject.fy = null;
        }

        return d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);
    }

    simulation.on("end", () => {
        console.log("Simulation ended, fitting nodes to SVG container.");
        fitNodes(nodes, width, height, container);
    });
};


function fitNodes(nodes, width, height, container) {
    const xs = nodes.map(d => d.x);
    const ys = nodes.map(d => d.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const bboxWidth = maxX - minX;
    const bboxHeight = maxY - minY;

    const svgWidth = width;
    const svgHeight = height;

    // Calculate scale and translation to fit all nodes
    const scale = 0.8 * Math.min(svgWidth / bboxWidth, svgHeight / bboxHeight, 1);
    const translateX = svgWidth / 2 - scale * (minX + bboxWidth / 2);
    const translateY = svgHeight / 2 - scale * (minY + bboxHeight / 2);

    container.transition()
        .duration(500)
        .attr("transform", `translate(${translateX},${translateY}) scale(${scale})`);
}

function emptyGraph() {
    console.log("Emptying graph");
    const svg = d3.select("svg");
    svg.selectAll("*").remove(); // Remove all elements from the SVG
    window.d3Container = null; // Clear the container reference
}