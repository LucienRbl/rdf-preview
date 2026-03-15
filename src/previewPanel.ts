import * as vscode from "vscode";
import { RDFParser } from "./rdfParser";
import { WebviewContentProvider } from "./webviewContent";

export class RDFPreviewPanel {
  public static currentPanel: RDFPreviewPanel | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly extensionUri: vscode.Uri;
  private readonly rdfParser: RDFParser;
  private readonly contentProvider: WebviewContentProvider;
  private disposables: vscode.Disposable[] = [];

  private constructor(
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
    document: vscode.TextDocument,
  ) {
    this.panel = panel;
    this.extensionUri = context.extensionUri;
    this.rdfParser = new RDFParser();
    this.contentProvider = new WebviewContentProvider(this.extensionUri);

    this.update(document);

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    this.panel.webview.onDidReceiveMessage(
      (message) => {
        if (message.command === "fullyRefreshGraph") {
          this.update(document, true);
        }
      },
      null,
      this.disposables,
    );

    vscode.workspace.onDidSaveTextDocument(
      (savedDocument) => {
        if (savedDocument.uri.toString() === document.uri.toString()) {
          this.update(savedDocument);
        }
      },
      null,
      this.disposables,
    );
  }

  public static createOrShow(
    context: vscode.ExtensionContext,
    document: vscode.TextDocument,
  ) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (RDFPreviewPanel.currentPanel) {
      RDFPreviewPanel.currentPanel.panel.reveal(vscode.ViewColumn.Two);
      RDFPreviewPanel.currentPanel.update(document);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "rdfPreview",
      "RDF Preview",
      vscode.ViewColumn.Two,
      { enableScripts: true },
    );

    RDFPreviewPanel.currentPanel = new RDFPreviewPanel(
      panel,
      context,
      document,
    );
  }

  public update(document: vscode.TextDocument, fullRefresh: boolean = false) {
    const { nodes, links } = this.rdfParser.getGraphData(document);

    if (fullRefresh || !this.panel.webview.html) {
      this.panel.webview.html = this.contentProvider.getHtmlContent(
        this.panel,
        nodes,
        links,
      );
    } else {
      this.panel.webview.postMessage({
        command: "updateGraph",
        nodes,
        links,
      });
    }
  }

  public dispose() {
    RDFPreviewPanel.currentPanel = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }
}
