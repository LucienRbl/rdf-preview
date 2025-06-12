import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "rdf-preview" is now active!');



    const disposable = vscode.commands.registerCommand('rdf-preview.showGraph', () => {
        const panel = vscode.window.createWebviewPanel(
            'rdfPreview', // Identifies the type of the webview. Used internally
            'RDF Preview', // Title of the panel displayed to the user
            vscode.ViewColumn.Two, // Editor column to show the new webview panel in.
            {
                enableScripts: true
            } // Webview options. More on these later.
        );
        const quads = getQuads(); // Replace with your RDF parsing logic
        const nodes = generateNodes(quads); // Function to convert quads to nodes
        const links = generateLinks(quads); // Function to convert quads to links

        panel.webview.html = getWebviewContent(nodes, links);
    });

    context.subscriptions.push(disposable);
}

const { Parser } = require('n3');
const parser = new Parser();
const prefixMap: { [key: string]: string } = {};


function getQuads() {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        vscode.window.showErrorMessage('No active text editor found.');
        return [];
    }

    const quads = parser.parse(editor.document.getText(), {
        onPrefix: (prefix: any, iri: any) => {
            console.log(prefix, iri.value);
            prefixMap[iri.value] = prefix;
        },
        onComment: (comment: any) => console.log(comment)
    });
    console.log(prefixMap);
    console.log(quads);
    return quads;
}

function replaceWithPrefix(iri: string) {
    const sortedEntries = Object.entries(prefixMap).sort((a, b) => b[0].length - a[0].length);

    for (const [key, value] of sortedEntries) {
        if (iri.includes(key)) {
            return iri.replace(key, value + ':');
        }
    }
    return iri;
}

function generateNodes(quads: any[]) {
    const nodes: { id: string }[] = [];
    const subjects = quads.map(quad => replaceWithPrefix(quad.subject.id));
    const objects = quads.map(quad => replaceWithPrefix(quad.object.id));
    const allNodes = [...new Set([...subjects, ...objects])];
    allNodes.forEach(node => nodes.push({ id: node }));
    return nodes;
}

function generateLinks(quads: any[]) {
    const links: { source: string, target: string, predicate: string }[] = [];
    quads.forEach(quad => {
        links.push({
            source: replaceWithPrefix(quad.subject.id),
            target: replaceWithPrefix(quad.object.id),
            predicate: replaceWithPrefix(quad.predicate.id)
        });
    });
    return links;
}

export function getWebviewContent(nodes: { id: string; }[], links: { source: string; target: string; }[]) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RDF Graph Preview</title>
        <script src="https://d3js.org/d3.v7.min.js"></script>
        <style>
            body { margin: 0; overflow: auto; }
            svg { width: 100vw; height: 100vh; }
        </style>
    </head>
    <body>
        <svg>
			<defs>
				<marker id="arrowhead" markerWidth="6" markerHeight="7" refX="10" refY="2.5" orient="auto">
					<polygon points="0,5 1.6666666666666667,2.5 0,0 5,2.5" fill="gray" />
				</marker>
			</defs>
		</svg>
        <script>
            const nodes = ${JSON.stringify(nodes)};
            const links = ${JSON.stringify(links)};

            // Create the SVG container

			const svg = d3.select("svg");
            const container = svg.append("g"); // This will be zoomed/panned

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
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    event.subject.fx = event.subject.x;
                    event.subject.fy = event.subject.y;
                }

                function dragged(event) {
                    event.subject.fx = event.x;
                    event.subject.fy = event.y;
                }

                function dragended(event) {
                    if (!event.active) simulation.alphaTarget(0);
                    event.subject.fx = null;
                    event.subject.fy = null;
                }

                return d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended);
            }
        </script>
    </body>
    </html>`;
}

// This method is called when your extension is deactivated
export function deactivate() { }
