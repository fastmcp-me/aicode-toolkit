# @agiflowai/aicode-toolkit

AI-powered code toolkit CLI for scaffolding and development workflows.

## Features

- **Template management**: Initialize templates folder and add templates from remote repositories
- **Dynamic template discovery**: Automatically finds templates in your workspace
- **Multiple frameworks**: Support for Next.js, Vite React, and custom boilerplates
- **Git integration**: Clone templates from GitHub repositories or subdirectories

## Installation

```bash
pnpm install @agiflowai/aicode-toolkit
```

Or install globally:

```bash
pnpm install -g @agiflowai/aicode-toolkit
```

## Usage

### Initialize Templates

The `init` command sets up your templates folder and **automatically downloads official templates** from the AgiFlow repository:

```bash
# Initialize templates folder and download official templates
aicode init

# Or specify a custom path
aicode init --path ./my-templates

# Skip auto-download if you want to add templates manually
aicode init --no-download
```

**What `init` does:**
1. Creates `templates/` folder in your workspace root
2. Automatically downloads official templates from [AgiFlow/aicode-toolkit](https://github.com/AgiFlow/aicode-toolkit/tree/main/templates)
3. Creates a README.md with usage instructions
4. Skips templates that already exist (safe to re-run)

**What gets downloaded:**
- ✅ `nextjs-15-drizzle` - Next.js 15 with App Router, TypeScript, Tailwind CSS 4, Storybook, and optional Drizzle ORM
- ✅ More templates coming soon...

### Add Templates

Add templates from GitHub repositories or subdirectories:

```bash
# Add a template from a full repository
aicode add --name my-template --url https://github.com/yourorg/nextjs-template

# Add a template from a repository subdirectory
aicode add \
  --name nextjs-15-drizzle \
  --url https://github.com/AgiFlow/aicode-toolkit/tree/main/templates/nextjs-15-drizzle

# Add to a specific type folder
aicode add \
  --name react-component \
  --url https://github.com/yourorg/react-component-scaffold \
  --type scaffold
```

**What `add` does:**
1. Parses GitHub URL to detect full repository vs subdirectory
2. Downloads template using git clone (full repo) or sparse checkout (subdirectory)
3. Validates template has required configuration files (scaffold.yaml)
4. Saves template to your templates folder

**Supported URL formats:**
- Full repository: `https://github.com/user/repo`
- Subdirectory: `https://github.com/user/repo/tree/branch/path/to/template`
- With `.git` extension: `https://github.com/user/repo.git`

## CLI Commands

### `aicode init`

Initialize templates folder structure at workspace root.

**Options:**
- `--path <path>`: Custom path for templates folder (default: `./templates`)
- `--no-download`: Skip automatic download of official templates

**Examples:**
```bash
# Initialize at default location
aicode init

# Initialize at custom location
aicode init --path ./custom-templates

# Initialize without downloading templates
aicode init --no-download
```

### `aicode add`

Add a template from a GitHub repository.

**Options:**
- `--name <name>`: Name for the template (required)
- `--url <url>`: GitHub repository URL (required)
- `--type <type>`: Template type folder (default: auto-detect)

**Examples:**
```bash
# Add template from full repository
aicode add --name my-template --url https://github.com/user/repo

# Add template from subdirectory
aicode add \
  --name nextjs-15 \
  --url https://github.com/AgiFlow/aicode-toolkit/tree/main/templates/nextjs-15-drizzle

# Specify custom type
aicode add \
  --name my-scaffold \
  --url https://github.com/user/repo \
  --type scaffold
```

## Template Structure

Templates are organized in the `templates/` folder at your workspace root:

```
templates/
├── nextjs-15-drizzle/
│   ├── scaffold.yaml          # Template configuration
│   ├── package.json.liquid    # Template files with variables
│   └── ...
└── README.md
```

Each template must have a `scaffold.yaml` file that defines:
- Boilerplate configurations
- Feature scaffolds
- Variable schemas
- File includes

## License

AGPL-3.0
