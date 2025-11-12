import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('rdf-preview.showGraph', () => {
        const panel = vscode.window.createWebviewPanel(
            'rdfPreview',
            'RDF Preview',
            vscode.ViewColumn.Two,
            {
                enableScripts: true
            }
        );

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active text editor found.');
            return;
        }



        const quads = getQuads(editor.document);
        const nodes = generateNodes(quads);
        const links = generateLinks(quads);



        panel.webview.html = getWebviewContent(panel, context, nodes, links);

        const docUri = editor.document.uri.toString();

        // Set up file watcher for auto-refresh on save
        const fileWatcher = vscode.workspace.onDidSaveTextDocument((savedDocument) => {
            if (savedDocument.uri.toString() === docUri) {
                refreshGraph(panel, savedDocument);
            }
        });

        // Store the watcher in subscriptions to clean up when panel is disposed
        panel.onDidDispose(() => {
            fileWatcher.dispose();
        });

        panel.webview.onDidReceiveMessage(async message => {
            if (message.command === 'refreshGraph') {
                // const updatedDocument = await vscode.workspace.openTextDocument(vscode.Uri.parse(docUri));
                refreshGraph(panel, editor.document);
            }
            if (message.command === 'fullyRefreshGraph') {
                fullyRefreshGraph(panel, editor.document);
            }
        });


    });

    context.subscriptions.push(disposable);
}


function fullyRefreshGraph(panel: vscode.WebviewPanel, document: vscode.TextDocument) {
    const quads = getQuads(document);
    const nodes = generateNodes(quads);
    const links = generateLinks(quads);

    panel.webview.postMessage({
        command: 'updateGraphFull',
        nodes: nodes,
        links: links
    });
}



// Helper function to refresh the graph
function refreshGraph(panel: vscode.WebviewPanel, document: vscode.TextDocument) {
    const updatedQuads = getQuads(document);
    const updatedNodes = generateNodes(updatedQuads);
    const updatedLinks = generateLinks(updatedQuads);

    panel.webview.postMessage({
        command: 'updateGraph',
        nodes: updatedNodes,
        links: updatedLinks
    });
}

const { Parser } = require('n3');
const parser = new Parser();
const prefixMap: { [key: string]: string } = {};


function getQuads(document: vscode.TextDocument): any[] {
    const quads = parser.parse(document.getText(), {
        onPrefix: (prefix: any, iri: any) => {
            console.log(prefix, iri.value);
            prefixMap[iri.value] = prefix;
        },
        onComment: (comment: any) => console.log(comment)
    });
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

export function getWebviewContent(
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
    nodes: { id: string; }[],
    links: { source: string; target: string; }[]) {
    // Get the URI for the local JS file
    const scriptUri = panel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'src', 'd3script.js')
    );

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RDF Graph Preview</title>
        <script src="https://d3js.org/d3.v7.min.js"></script>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=recenter,refresh" />
        <style>
            body { margin: 0; overflow: auto; }
            svg { width: 100vw; height: 100vh; }
        </style>
        <link rel="stylesheet" href="${panel.webview.asWebviewUri(
        vscode.Uri.joinPath(context.extensionUri, 'src', 'style.css')
    )}" />
    </head>
    <body>
        <div class="controls-container">
            <button id="fit-zoom-btn" class="btn"><span class="material-symbols-outlined">recenter</span></button>
            <button id="refresh-btn" class="btn"><span class="material-symbols-outlined">refresh</span></button>
        </div>
        <svg>
			<defs>
				<marker id="arrowhead" markerWidth="6" markerHeight="7" refX="10" refY="2.5" orient="auto">
					<polygon points="0,5 1.6666666666666667,2.5 0,0 5,2.5" fill="gray" />
				</marker>
			</defs>
		</svg>
        <script src="${scriptUri}"></script>
        <script>
            const vscode = acquireVsCodeApi();
            console.log('vscode API acquired', vscode);
            const nodes = ${JSON.stringify(nodes)};
            const links = ${JSON.stringify(links)};

            window.renderGraph(nodes, links);

            document.getElementById('fit-zoom-btn').onclick = function() {
                window.fitNodes(nodes, window.innerWidth, window.innerHeight, window.d3Container);
            }


            document.getElementById('refresh-btn').onclick = function() {
                vscode.postMessage({ command: 'fullyRefreshGraph' });
            }

            window.addEventListener('message', event => {
                const message = event.data;

                console.log('Received message:', message);
                if (message.command === 'updateGraph') {
                    // Use incremental update instead of full re-render
                    window.updateGraph(message.nodes, message.links);
                  
                }

                if (message.command === 'updateGraphFull') {
                    window.emptyGraph();
                    window.renderGraph(message.nodes, message.links);
                }
            });
        </script>
    </body>
    </html>`;
}

// This method is called when your extension is deactivated
export function deactivate() { }
