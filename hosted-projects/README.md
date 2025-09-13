jec# Hosted Projects

This directory contains projects that are hosted directly on the portfolio website. Each project should be in its own subdirectory with an `index.html` file as the entry point.

## Project Structure

```
hosted-projects/
├── minesweeper/
│   ├── index.html          # Main HTML file
│   ├── minesweeper.ts      # TypeScript source
│   ├── minesweeper.js      # Compiled JavaScript
│   ├── tsconfig.json       # TypeScript configuration
│   ├── package.json        # Node.js dependencies
│   └── build.bat           # Build script for Windows
├── ascii-rpg/
│   ├── index.html          # Main HTML file
│   ├── ascii-rpg.ts        # TypeScript source
│   ├── ascii-rpg.js        # Compiled JavaScript
│   ├── tsconfig.json       # TypeScript configuration
│   ├── package.json        # Node.js dependencies
│   └── build.bat           # Build script for Windows
└── README.md               # This file
```

## Adding New Hosted Projects

1. Create a new directory under `hosted-projects/`
2. Add your project files (HTML, CSS, JS/TS, etc.)
3. Ensure there's an `index.html` file as the entry point
4. Update the project in `projects.go` with:
   - `DemoType: "hosted"`
   - `DemoURL: "/hosted/your-project-name/"`
   - `HostedPath: "your-project-name"`

## TypeScript Projects

For TypeScript projects:
1. Create `tsconfig.json` and `package.json` files
2. Run `npm install` to install dependencies
3. Run `npx tsc` to compile TypeScript to JavaScript
4. Update `index.html` to reference the compiled `.js` file

## Accessing Hosted Projects

Hosted projects are accessible via:
- `http://localhost:8080/hosted/project-name/`

## Example Projects

### Minesweeper Game
The Minesweeper game demonstrates:
- TypeScript with strict type checking
- Modern ES2020 features
- DOM manipulation and event handling
- Game logic implementation
- Responsive design with CSS3
- Glassmorphism UI design

To build the Minesweeper project:
```bash
cd hosted-projects/minesweeper
npm install
npx tsc
```

### ASCII RPG Adventure
The ASCII RPG Adventure demonstrates:
- TypeScript with complex game state management
- ASCII art integration
- Turn-based combat system
- Character progression and inventory management
- Terminal-style UI design
- RPG game mechanics implementation

To build the ASCII RPG project:
```bash
cd hosted-projects/ascii-rpg
npm install
npx tsc
```

## Best Practices

1. **Self-contained**: Each project should work independently
2. **Responsive**: Design for mobile and desktop
3. **Modern**: Use current web standards and best practices
4. **TypeScript**: Prefer TypeScript for complex projects
5. **Documentation**: Include README files for complex projects
6. **Build scripts**: Provide easy build/development commands
