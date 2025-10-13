/**
 * XState machine definition for improved init command flow
 * Pure state machine - no implementation details
 * Actors are provided by the CLI command
 */

import type { ProjectType } from '@agiflowai/aicode-utils';
import { assign, createMachine } from 'xstate';
import type { CodingAgent } from '../services/CodingAgentService';

/**
 * Context type for the init machine
 */
export interface InitMachineContext {
  // Workspace and project info
  workspaceRoot?: string;
  projectName?: string;
  projectType?: ProjectType;
  projectPath?: string;
  repositoryExists: boolean;

  // Project type detection
  detectionConfidence?: 'high' | 'medium' | 'low';
  detectionIndicators?: string[];

  // Templates configuration
  templatesPath?: string;
  tmpTemplatesPath?: string;
  selectedTemplates?: string[];

  // MCP server selection
  selectedMcpServers?: string[];

  // Coding agent setup
  detectedCodingAgent?: CodingAgent | null;
  codingAgent?: CodingAgent;

  // CLI options
  options: {
    name?: string;
    projectType?: string;
    skipTemplates?: boolean;
    skipMcp?: boolean;
  };

  // Error handling
  error?: Error;
}

/**
 * Input type for the init machine
 */
export interface InitMachineInput {
  options: {
    name?: string;
    projectType?: string;
    skipTemplates?: boolean;
    skipMcp?: boolean;
  };
}

/**
 * Init command state machine
 * Pure declarative state machine definition
 * Actors are provided externally for better separation of concerns
 */
export const initMachine = createMachine(
  {
    id: 'init',
    types: {} as {
      context: InitMachineContext;
      input: InitMachineInput;
    },
    initial: 'displayingBanner',
    context: ({ input }) => ({
      workspaceRoot: undefined,
      projectName: undefined,
      projectType: undefined,
      projectPath: undefined,
      repositoryExists: false,
      detectionConfidence: undefined,
      detectionIndicators: undefined,
      templatesPath: undefined,
      tmpTemplatesPath: undefined,
      selectedTemplates: undefined,
      selectedMcpServers: undefined,
      detectedCodingAgent: undefined,
      codingAgent: undefined,
      options: input.options,
      error: undefined,
    }),
    states: {
      /**
       * Display welcome banner
       */
      displayingBanner: {
        invoke: {
          src: 'displayBanner',
          onDone: {
            target: 'checkingWorkspace',
          },
        },
      },

      /**
       * Check if workspace exists by looking for .git folder
       */
      checkingWorkspace: {
        invoke: {
          src: 'checkWorkspaceExists',
          onDone: [
            {
              target: 'detectingProjectType',
              guard: ({ event }) => event.output.exists === true,
              actions: assign({
                workspaceRoot: ({ event }) => event.output.workspaceRoot,
                repositoryExists: () => true,
              }),
            },
            {
              target: 'creatingNewProject',
              guard: ({ event }) => event.output.exists === false,
              actions: assign({
                repositoryExists: () => false,
              }),
            },
          ],
        },
      },

      /**
       * Detect project type (monorepo vs monolith)
       */
      detectingProjectType: {
        invoke: {
          src: 'detectProjectType',
          input: ({ context }) => ({
            workspaceRoot: context.workspaceRoot!,
          }),
          onDone: [
            {
              target: 'checkingSkipTemplates',
              guard: ({ event }) => event.output.confidence === 'high',
              actions: assign({
                projectType: ({ event }) => event.output.projectType,
                detectionConfidence: ({ event }) => event.output.confidence,
                detectionIndicators: ({ event }) => event.output.indicators,
              }),
            },
            {
              target: 'promptingProjectType',
              actions: assign({
                detectionConfidence: ({ event }) => event.output.confidence,
                detectionIndicators: ({ event }) => event.output.indicators,
              }),
            },
          ],
          onError: {
            target: 'failed',
            actions: assign({
              error: ({ event }) => event.error as Error,
            }),
          },
        },
      },

      /**
       * Prompt user to select project type if detection confidence is low
       */
      promptingProjectType: {
        invoke: {
          src: 'promptProjectType',
          input: ({ context }) => ({
            providedProjectType: context.options.projectType,
            detectionIndicators: context.detectionIndicators,
          }),
          onDone: {
            target: 'checkingSkipTemplates',
            actions: assign({
              projectType: ({ event }) => event.output,
            }),
          },
          onError: {
            target: 'failed',
            actions: assign({
              error: ({ event }) => event.error as Error,
            }),
          },
        },
      },

      /**
       * Create new project workflow
       */
      creatingNewProject: {
        initial: 'promptingProjectName',
        states: {
          /**
           * Prompt for project name
           */
          promptingProjectName: {
            invoke: {
              src: 'promptProjectName',
              input: ({ context }) => ({
                providedName: context.options.name,
              }),
              onDone: {
                target: 'creatingProjectDirectory',
                actions: assign({
                  projectName: ({ event }) => event.output,
                }),
              },
              onError: {
                target: '#init.failed',
                actions: assign({
                  error: ({ event }) => event.error as Error,
                }),
              },
            },
          },

          /**
           * Create project directory
           */
          creatingProjectDirectory: {
            invoke: {
              src: 'createProjectDirectory',
              input: ({ context }) => ({
                projectName: context.projectName!,
              }),
              onDone: {
                target: 'promptingGitSetup',
                actions: assign({
                  projectPath: ({ event }) => event.output.projectPath,
                  workspaceRoot: ({ event }) => event.output.projectPath,
                }),
              },
              onError: {
                target: '#init.failed',
                actions: assign({
                  error: ({ event }) => event.error as Error,
                }),
              },
            },
          },

          /**
           * Setup Git repository
           */
          promptingGitSetup: {
            invoke: {
              src: 'promptGitSetup',
              input: ({ context }) => ({
                projectPath: context.projectPath!,
              }),
              onDone: {
                target: 'promptingProjectType',
              },
              onError: {
                target: '#init.failed',
                actions: assign({
                  error: ({ event }) => event.error as Error,
                }),
              },
            },
          },

          /**
           * Prompt for project type
           */
          promptingProjectType: {
            invoke: {
              src: 'promptProjectType',
              input: ({ context }) => ({
                providedProjectType: context.options.projectType,
              }),
              onDone: {
                target: '#init.checkingSkipTemplates',
                actions: assign({
                  projectType: ({ event }) => event.output,
                }),
              },
              onError: {
                target: '#init.failed',
                actions: assign({
                  error: ({ event }) => event.error as Error,
                }),
              },
            },
          },
        },
      },

      /**
       * Check if templates should be downloaded
       */
      checkingSkipTemplates: {
        always: [
          {
            target: 'promptingMcpSelection',
            guard: ({ context }) => !context.options.skipTemplates,
          },
          {
            target: 'checkingSkipMcp',
          },
        ],
      },

      /**
       * Prompt user to select MCP servers
       */
      promptingMcpSelection: {
        invoke: {
          src: 'promptMcpSelection',
          onDone: {
            target: 'downloadingTemplates',
            actions: assign({
              selectedMcpServers: ({ event }) => event.output,
            }),
          },
          onError: {
            target: 'failed',
            actions: assign({
              error: ({ event }) => event.error as Error,
            }),
          },
        },
      },

      /**
       * Download templates to tmp folder
       */
      downloadingTemplates: {
        invoke: {
          src: 'downloadTemplates',
          onDone: {
            target: 'listingTemplates',
            actions: assign({
              tmpTemplatesPath: ({ event }) => event.output,
            }),
          },
          onError: {
            target: 'failed',
            actions: assign({
              error: ({ event }) => event.error as Error,
            }),
          },
        },
      },

      /**
       * List available templates
       */
      listingTemplates: {
        invoke: {
          src: 'listTemplates',
          input: ({ context }) => ({
            tmpTemplatesPath: context.tmpTemplatesPath!,
          }),
          onDone: {
            target: 'promptingTemplateSelection',
          },
          onError: {
            target: 'failed',
            actions: assign({
              error: ({ event }) => event.error as Error,
            }),
          },
        },
      },

      /**
       * Prompt user to select templates
       */
      promptingTemplateSelection: {
        invoke: {
          src: 'promptTemplateSelection',
          input: ({ context }) => ({
            tmpTemplatesPath: context.tmpTemplatesPath!,
            projectType: context.projectType!,
          }),
          onDone: {
            target: 'copyingTemplates',
            actions: assign({
              selectedTemplates: ({ event }) => event.output,
            }),
          },
          onError: {
            target: 'failed',
            actions: assign({
              error: ({ event }) => event.error as Error,
            }),
          },
        },
      },

      /**
       * Copy selected templates to workspace
       */
      copyingTemplates: {
        invoke: {
          src: 'copyTemplates',
          input: ({ context }) => ({
            tmpTemplatesPath: context.tmpTemplatesPath!,
            workspaceRoot: context.workspaceRoot!,
            selectedTemplates: context.selectedTemplates!,
            projectType: context.projectType!,
            selectedMcpServers: context.selectedMcpServers,
          }),
          onDone: {
            target: 'creatingConfig',
            actions: assign({
              templatesPath: ({ event }) => event.output,
            }),
          },
          onError: {
            target: 'failed',
            actions: assign({
              error: ({ event }) => event.error as Error,
            }),
          },
        },
      },

      /**
       * Create configuration (toolkit.yaml for monolith)
       */
      creatingConfig: {
        invoke: {
          src: 'createConfig',
          input: ({ context }) => ({
            workspaceRoot: context.workspaceRoot!,
            projectType: context.projectType!,
            selectedTemplates: context.selectedTemplates!,
          }),
          onDone: {
            target: 'checkingSkipMcp',
          },
          onError: {
            target: 'failed',
            actions: assign({
              error: ({ event }) => event.error as Error,
            }),
          },
        },
      },

      /**
       * Check if MCP setup should be skipped
       */
      checkingSkipMcp: {
        always: [
          {
            target: 'detectingCodingAgent',
            guard: ({ context }) => !context.options.skipMcp,
          },
          {
            target: 'cleaningUp',
          },
        ],
      },

      /**
       * Detect coding agent automatically
       */
      detectingCodingAgent: {
        invoke: {
          src: 'detectCodingAgent',
          input: ({ context }) => ({
            workspaceRoot: context.workspaceRoot!,
          }),
          onDone: {
            target: 'promptingCodingAgent',
            actions: assign({
              detectedCodingAgent: ({ event }) => event.output,
            }),
          },
          onError: {
            target: 'failed',
            actions: assign({
              error: ({ event }) => event.error as Error,
            }),
          },
        },
      },

      /**
       * Prompt for coding agent selection
       */
      promptingCodingAgent: {
        invoke: {
          src: 'promptCodingAgent',
          input: ({ context }) => ({
            detectedAgent: context.detectedCodingAgent,
          }),
          onDone: {
            target: 'configuringMCP',
            actions: assign({
              codingAgent: ({ event }) => event.output,
            }),
          },
          onError: {
            target: 'failed',
            actions: assign({
              error: ({ event }) => event.error as Error,
            }),
          },
        },
      },

      /**
       * Configure MCP for coding agent
       */
      configuringMCP: {
        invoke: {
          src: 'configureMCP',
          input: ({ context }) => ({
            workspaceRoot: context.workspaceRoot!,
            codingAgent: context.codingAgent!,
          }),
          onDone: {
            target: 'cleaningUp',
          },
          onError: {
            target: 'failed',
            actions: assign({
              error: ({ event }) => event.error as Error,
            }),
          },
        },
      },

      /**
       * Clean up temporary files
       */
      cleaningUp: {
        invoke: {
          src: 'cleanup',
          input: ({ context }) => ({
            tmpTemplatesPath: context.tmpTemplatesPath,
          }),
          onDone: {
            target: 'completed',
          },
          // Don't fail on cleanup errors
          onError: {
            target: 'completed',
          },
        },
      },

      /**
       * Success state
       */
      completed: {
        type: 'final',
      },

      /**
       * Failure state
       */
      failed: {
        type: 'final',
      },
    },
  },
  {
    guards: {},
  },
);
