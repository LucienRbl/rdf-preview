import * as vscode from "vscode";
import { RDFPreviewPanel } from "./previewPanel";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "rdf-preview.showGraph",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        RDFPreviewPanel.createOrShow(context, editor.document);
      } else {
        vscode.window.showErrorMessage("No active text editor found.");
      }
    },
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
