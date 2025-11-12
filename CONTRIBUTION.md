# Contributing to RDF Preview

Thank you for your interest in contributing to RDF Preview! This VS Code extension provides visualization of RDF graphs in Turtle and N-Triples formats.

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) (version 20.x or higher)
- [VS Code](https://code.visualstudio.com/) (version 1.100.0 or higher)
- Git

### Setup Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/LucienRbl/rdf-preview.git
   cd rdf-preview
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```


4. **Open VSCode and Run the Extension**
   - Press `F5` to open a new VS Code window with the extension loaded
   - Open a `.ttl` or `.nt` file
   - Click the "Preview RDF Graph" button in the editor toolbar

## 🏗️ Project Structure

```
rdf-preview/
├── src/
│   ├── extension.ts          # Main extension logic
│   ├── d3script.js          # D3.js graph visualization
│   ├── style.css            # CSS styles for webview
│   └── test/
│       ├── extension.test.ts # Unit tests
│       └── darwin.ttl       # Test RDF file
├── package.json             # Extension manifest
├── tsconfig.json           # TypeScript configuration
├── eslint.config.mjs       # ESLint configuration
└── README.md               # Project documentation
```

## 🛠️ Development Workflow

### Building and Testing

```bash
# Compile TypeScript
npm run compile

# Watch for changes (recommended during development)
npm run watch

# Run linting
npm run lint

# Run tests
npm test
```

### Testing Your Changes

1. **Manual Testing**
   - Press `F5` to launch extension development host
   - Open test files in `src/test/darwin.ttl`
   - Test the "Preview RDF Graph" command

2. **Unit Tests**
   - Run `npm test` to execute automated tests
   - Tests are located in `src/test/extension.test.ts`

### Debugging

- Set breakpoints in `src/extension.ts`
- Use VS Code's built-in debugger
- Check the Debug Console for extension output
- Use browser dev tools for webview debugging

## 📝 Contributing Guidelines

### Code Style

- Follow the existing TypeScript/JavaScript conventions
- Use ESLint for code formatting: `npm run lint`
- Add JSDoc comments for public functions
- Use meaningful variable and function names

### Commit Messages

Use conventional commit format:
```
feat: add support for RDF/XML format
fix: resolve graph rendering issue with blank nodes
docs: update README with new features
test: add unit tests for graph generation
```

### Pull Request Process

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Write clean, readable code
   - Add tests for new functionality
   - Update documentation if needed

3. **Test Thoroughly**
   - Run all tests: `npm test`
   - Test manually with various RDF files
   - Ensure no linting errors: `npm run lint`

4. **Submit PR**
   - Push your branch to your fork
   - Open a pull request with a clear description
   - Reference any related issues

## 🐛 Bug Reports

When reporting bugs, please include:

- VS Code version
- Extension version
- Sample RDF file that causes the issue
- Steps to reproduce
- Expected vs actual behavior
- Console errors (if any)


## 💡 Feature Requests

We welcome feature suggestions! Please:

- Check existing issues first
- Provide a clear use case
- Describe the expected behavior
- Consider implementation complexity

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to RDF Preview! 🎉