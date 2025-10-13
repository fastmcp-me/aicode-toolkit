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
export interface InitV2MachineContext {
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

  // Coding agent setup
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
export interface InitV2MachineInput {
  options: {
    name?: string;
    projectType?: string;
    skipTemplates?: boolean;
    skipMcp?: boolean;
  };
}

/**
 * Improved init command state machine
 * Pure declarative state machine definition
 * Actors are provided externally for better separation of concerns
 */
export const initV2Machine = createMachine(
  {
    id: 'initV2',
    types: {} as {
      context: InitV2MachineContext;
      input: InitV2MachineInput;
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
                target: '#initV2.failed',
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
                target: '#initV2.failed',
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
                target: '#initV2.failed',
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
                target: '#initV2.checkingSkipTemplates',
                actions: assign({
                  projectType: ({ event }) => event.output,
                }),
              },
              onError: {
                target: '#initV2.failed',
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
            target: 'downloadingTemplates',
            guard: ({ context }) => !context.options.skipTemplates,
          },
          {
            target: 'checkingSkipMcp',
          },
        ],
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
            target: 'promptingCodingAgent',
            guard: ({ context }) => !context.options.skipMcp,
          },
          {
            target: 'cleaningUp',
          },
        ],
      },

      /**
       * Prompt for coding agent selection
       */
      promptingCodingAgent: {
        invoke: {
          src: 'promptCodingAgent',
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
