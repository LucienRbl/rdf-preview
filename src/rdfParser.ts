import * as vscode from "vscode";
const { Parser } = require("n3");

export interface RDFNode {
  id: string;
}

export interface RDFLink {
  source: string;
  target: string;
  predicate: string;
}

export class RDFParser {
  private parser = new Parser();
  private prefixMap: Record<string, string> = {};

  public getGraphData(document: vscode.TextDocument): {
    nodes: RDFNode[];
    links: RDFLink[];
  } {
    this.prefixMap = {};
    const quads = this.parser.parse(document.getText(), {
      onPrefix: (prefix: string, iri: { value: string }) => {
        this.prefixMap[iri.value] = prefix;
      },
    });

    const nodes = this.generateNodes(quads);
    const links = this.generateLinks(quads);
    return { nodes, links };
  }

  private replaceWithPrefix(iri: string): string {
    const sortedEntries = Object.entries(this.prefixMap).sort(
      (a, b) => b[0].length - a[0].length,
    );

    for (const [key, value] of sortedEntries) {
      if (iri.includes(key)) {
        return iri.replace(key, value + ":");
      }
    }
    return iri;
  }

  private generateNodes(quads: any[]): RDFNode[] {
    const subjects = quads.map((quad) =>
      this.replaceWithPrefix(quad.subject.id),
    );
    const objects = quads.map((quad) => this.replaceWithPrefix(quad.object.id));
    const uniqueNodes = [...new Set([...subjects, ...objects])];
    return uniqueNodes.map((id) => ({ id }));
  }

  private generateLinks(quads: any[]): RDFLink[] {
    return quads.map((quad) => ({
      source: this.replaceWithPrefix(quad.subject.id),
      target: this.replaceWithPrefix(quad.object.id),
      predicate: this.replaceWithPrefix(quad.predicate.id),
    }));
  }
}
