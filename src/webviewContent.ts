import * as vscode from "vscode";
import { RDFNode, RDFLink } from "./rdfParser";

export class WebviewContentProvider {
  constructor(private readonly extensionUri: vscode.Uri) {}

  public getHtmlContent(
    panel: vscode.WebviewPanel,
    nodes: RDFNode[],
    links: RDFLink[],
  ): string {
    const scriptUri = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "media", "d3script.js"),
    );
    const styleUri = panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "media", "style.css"),
    );

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RDF Graph Preview</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=close,recenter,refresh,search" />
    <link rel="stylesheet" href="${styleUri}" />
</head>
<body>
    <div class="controls-container">
        <button id="fit-zoom-btn" class="btn" title="Recenter"><span class="material-symbols-outlined">recenter</span></button>
        <button id="refresh-btn" class="btn" title="Refresh Graph"><span class="material-symbols-outlined">refresh</span></button>
        <div class="search-container">
            <button id="search-btn" class="btn"><span class="material-symbols-outlined">search</span></button>
            <input type="text" id="node-search" placeholder="Search node..." class="search-input">
            <button id="clear-search-btn" class="btn" style="display: none;">
                <span class="material-symbols-outlined">close</span>
            </button>
        </div>
    </div>
    <svg>
        <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="7" refX="10" refY="2.5" orient="auto" markerUnits="strokeWidth">
                <polygon points="0,5 1.6667,2.5 0,0 5,2.5" fill="context-stroke" />
            </marker>
        </defs>
    </svg>
    <script src="${scriptUri}"></script>
    <script>
        const vscode = acquireVsCodeApi();
        const nodes = ${JSON.stringify(nodes)};
        const links = ${JSON.stringify(links)};

        window.renderGraph(nodes, links);

        document.getElementById('fit-zoom-btn').onclick = () => {
            window.fitNodes(nodes, window.innerWidth, window.innerHeight, window.d3Container);
        };

        document.getElementById('refresh-btn').onclick = () => {
            vscode.postMessage({ command: 'fullyRefreshGraph' });
        };

        const searchInput = document.getElementById('node-search');
        const searchBtn = document.getElementById('search-btn');
        const clearSearchBtn = document.getElementById('clear-search-btn');

        let searchTimeout;
        const performSearch = () => {
            const term = searchInput.value.toLowerCase();
            window.highlightNodes(term);
            clearSearchBtn.style.display = term ? 'flex' : 'none';
        };

        searchBtn.onclick = performSearch;
        clearSearchBtn.onclick = () => {
            searchInput.value = '';
            performSearch();
            searchInput.focus();
        };

        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(performSearch, 100);
        });

        searchInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                performSearch();
            }
        };

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateGraph':
                    window.updateGraph(message.nodes, message.links);
                    break;
                case 'updateGraphFull':
                    window.emptyGraph();
                    window.renderGraph(message.nodes, message.links);
                    break;
            }
        });
    </script>
</body>
</html>`;
  }
}
