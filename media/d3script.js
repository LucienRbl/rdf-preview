(function () {
  const svg = d3.select("svg");
  let container = svg.append("g");
  let simulation, graphElements, currentNodes, currentLinks;

  svg.call(
    d3.zoom().on("zoom", (event) => {
      container.attr("transform", event.transform);
    }),
  );

  window.renderGraph = function (nodes, links) {
    currentNodes = nodes;
    currentLinks = links;

    const width = window.innerWidth;
    const height = window.innerHeight;

    simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(100),
      )
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const linkGroup = container.append("g").attr("class", "links");
    const nodeGroup = container.append("g").attr("class", "nodes");
    const nodeLabelGroup = container.append("g").attr("class", "node-labels");
    const linkLabelGroup = container.append("g").attr("class", "link-labels");

    const link = linkGroup
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("class", "link")
      .attr("marker-end", "url(#arrowhead)");

    const node = nodeGroup
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("class", (d) =>
        d.id.startsWith('"') ? "node literal" : "node iri",
      )
      .attr("r", 10)
      .call(drag(simulation));

    const nodeText = nodeLabelGroup
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("class", "node-label")
      .text((d) => (d.id.startsWith("_") ? "" : d.id));

    const linkText = linkLabelGroup
      .selectAll("text")
      .data(links)
      .join("text")
      .attr("class", "link-label")
      .text((d) => d.predicate);

    setupInteractions(node, link, nodeText, linkText);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      nodeText.attr("x", (d) => d.x + 15).attr("y", (d) => d.y + 3);
      linkText
        .attr("x", (d) => (d.source.x + d.target.x) / 2)
        .attr("y", (d) => (d.source.y + d.target.y) / 2);
    });

    graphElements = {
      link,
      node,
      nodeText,
      linkText,
      container,
      groups: { linkGroup, nodeGroup, nodeLabelGroup, linkLabelGroup },
    };
    window.d3Container = container;
  };

  function setupInteractions(node, link, nodeText, linkText) {
    node
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).classed("highlighted", true);
        nodeText.filter((td) => td.id === d.id).classed("highlighted", true);
      })
      .on("mouseout", (event, d) => {
        d3.select(event.currentTarget).classed("highlighted", false);
        nodeText.filter((td) => td.id === d.id).classed("highlighted", false);
      });

    link
      .on("mouseover", (event, d) => {
        d3.select(event.currentTarget).classed("highlighted", true);
        linkText.filter((td) => td === d).classed("highlighted", true);
      })
      .on("mouseout", (event, d) => {
        d3.select(event.currentTarget).classed("highlighted", false);
        linkText.filter((td) => td === d).classed("highlighted", false);
      });
  }

  window.updateGraph = function (newNodes, newLinks) {
    if (!simulation || !graphElements) {
      window.emptyGraph();
      window.renderGraph(newNodes, newLinks);
      return;
    }

    const { groups } = graphElements;
    const nodeMap = new Map((currentNodes || []).map((n) => [n.id, n]));
    newNodes.forEach((n) => {
      const old = nodeMap.get(n.id);
      if (old) {
        Object.assign(n, {
          x: old.x,
          y: old.y,
          vx: old.vx,
          vy: old.vy,
          fx: old.fx,
          fy: old.fy,
        });
      }
    });

    const node = groups.nodeGroup
      .selectAll("circle")
      .data(newNodes, (d) => d.id)
      .join(
        (enter) => enter.append("circle").attr("r", 10).call(drag(simulation)),
        (update) => update,
        (exit) => exit.remove(),
      )
      .attr("class", (d) =>
        d.id.startsWith('"') ? "node literal" : "node iri",
      );

    const nodeText = groups.nodeLabelGroup
      .selectAll("text")
      .data(newNodes, (d) => d.id)
      .join("text")
      .attr("class", "node-label")
      .text((d) => (d.id.startsWith("_") ? "" : d.id));

    const link = groups.linkGroup
      .selectAll("line")
      .data(
        newLinks,
        (d) =>
          `${d.source.id || d.source}-${d.target.id || d.target}-${d.predicate}`,
      )
      .join("line")
      .attr("class", "link")
      .attr("marker-end", "url(#arrowhead)");

    const linkText = groups.linkLabelGroup
      .selectAll("text")
      .data(
        newLinks,
        (d) =>
          `${d.source.id || d.source}-${d.target.id || d.target}-${d.predicate}`,
      )
      .join("text")
      .attr("class", "link-label")
      .text((d) => d.predicate);

    setupInteractions(node, link, nodeText, linkText);

    simulation.nodes(newNodes);
    simulation.force("link").links(newLinks);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      nodeText.attr("x", (d) => d.x + 15).attr("y", (d) => d.y + 3);
      linkText
        .attr("x", (d) => (d.source.x + d.target.x) / 2)
        .attr("y", (d) => (d.source.y + d.target.y) / 2);
    });

    simulation.alpha(0.1).restart();
    currentNodes = newNodes;
    currentLinks = newLinks;
    graphElements = { ...graphElements, node, link, nodeText, linkText };
  };

  window.fitNodes = function (nodes, width, height, container) {
    if (!nodes || !nodes.length) {
      return;
    }
    const xs = nodes.filter((d) => d.x !== undefined).map((d) => d.x);
    const ys = nodes.filter((d) => d.y !== undefined).map((d) => d.y);
    if (!xs.length) {
      return;
    }
    const minX = Math.min(...xs),
      maxX = Math.max(...xs);
    const minY = Math.min(...ys),
      maxY = Math.max(...ys);
    const bw = maxX - minX,
      bh = maxY - minY;
    const scale = 0.8 * Math.min(width / (bw || 1), height / (bh || 1), 1);
    const tx = width / 2 - scale * (minX + bw / 2);
    const ty = height / 2 - scale * (minY + bh / 2);
    container
      .transition()
      .duration(500)
      .attr("transform", `translate(${tx},${ty}) scale(${scale})`);
  };

  window.highlightNodes = function (term) {
    if (!graphElements) {
      return;
    }
    const { node, nodeText, link, linkText } = graphElements;
    const hasTerm = term && term.trim() !== "";
    const match = (val) =>
      val && val.toLowerCase().includes(term.toLowerCase());

    node.classed("highlighted", (d) => hasTerm && match(d.id));
    nodeText.classed("highlighted", (d) => hasTerm && match(d.id));
    link.classed("highlighted", (d) => hasTerm && match(d.predicate));
    linkText.classed("highlighted", (d) => hasTerm && match(d.predicate));
  };

  window.emptyGraph = function () {
    container.selectAll("*").remove();
    if (simulation) {
      simulation.stop();
    }
    simulation = graphElements = currentNodes = currentLinks = null;
  };

  function drag(simulation) {
    return d3
      .drag()
      .on("start", (event) => {
        if (!event.active) {
          simulation.alphaTarget(0.3).restart();
        }
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on("drag", (event) => {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on("end", (event) => {
        if (!event.active) {
          simulation.alphaTarget(0);
        }
        event.subject.fx = null;
        event.subject.fy = null;
      });
  }
})();
