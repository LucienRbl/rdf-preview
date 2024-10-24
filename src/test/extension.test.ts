import * as assert from 'assert';

import * as vscode from 'vscode';
import { getWebviewContent } from '../extension';

suite('getWebviewContent Tests', () => {
	test('should return valid HTML content', () => {
		const nodes = [{ id: 'node1' }, { id: 'node2' }];
		const links = [{ source: 'node1', target: 'node2', predicate: 'link1' }];
		const content = getWebviewContent(nodes, links);

		assert.ok(content.includes('<!DOCTYPE html>'), 'HTML content should start with <!DOCTYPE html>');
		assert.ok(content.includes('<svg></svg>'), 'HTML content should include an SVG element');
		assert.ok(content.includes('const nodes = [{"id":"node1"},{"id":"node2"}];'), 'HTML content should include nodes data');
		assert.ok(content.includes('const links = [{"source":"node1","target":"node2","predicate":"link1"}];'), 'HTML content should include links data');
	});

	test('should include D3.js script', () => {
		const nodes = [{ id: 'node1' }, { id: 'node2' }];
		const links = [{ source: 'node1', target: 'node2', predicate: 'link1' }];
		const content = getWebviewContent(nodes, links);

		assert.ok(content.includes('<script src="https://d3js.org/d3.v7.min.js"></script>'), 'HTML content should include D3.js script');
	});

	test('should include nodes and links in the script', () => {
		const nodes = [{ id: 'node1' }, { id: 'node2' }];
		const links = [{ source: 'node1', target: 'node2', predicate: 'link1' }];
		const content = getWebviewContent(nodes, links);

		assert.ok(content.includes('const nodes = [{"id":"node1"},{"id":"node2"}];'), 'HTML content should include nodes data in the script');
		assert.ok(content.includes('const links = [{"source":"node1","target":"node2","predicate":"link1"}];'), 'HTML content should include links data in the script');
	});

	test('should include styles for SVG', () => {
		const nodes = [{ id: 'node1' }, { id: 'node2' }];
		const links = [{ source: 'node1', target: 'node2', predicate: 'link1' }];
		const content = getWebviewContent(nodes, links);

		assert.ok(content.includes('body { margin: 0; overflow: auto; }'), 'HTML content should include body styles');
		assert.ok(content.includes('svg { width: 100vw; height: 100vh; }'), 'HTML content should include SVG styles');
	});
});
