/**
 * XState machine definition for init command flow
 * Pure state machine - no implementation details
 * Actors are provided by the CLI command
 */

import path from 'node:path';
import type { ProjectType } from '@agiflowai/aicode-utils';
import { assign, createMachine } from 'xstate';

/**
 * Context type for the init machine
 */
export interface InitMachineContext {
  // Workspace and project info
  workspaceRoot?: string;
  projectName?: string;
  projectType?: ProjectType;
  projectPath?: string;

  // Templates configuration
  templatesPath?: string;
  customTemplatesPath?: string;

  // CLI options
  options: {
    download: boolean;
    path?: string;
    name?: string;
    projectType?: string;
  };

  // Error handling
  error?: Error;
}

/**
 * Input type for the init machine
 */
export interface InitMachineInput {
  options: {
    download: boolean;
    path?: string;
    name?: string;
    projectType?: string;
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
    initial: 'checkingWorkspace',
    context: ({ input }) => ({
      workspaceRoot: undefined,
      projectName: undefined,
      projectType: undefined,
      projectPath: undefined,
      templatesPath: undefined,
      customTemplatesPath: undefined,
      options: input.options,
      error: undefined,
    }),
    states: {
      /**
       * Check if workspace root exists by finding .git folder
       */
      checkingWorkspace: {
        invoke: {
          src: 'findWorkspaceRoot',
          onDone: {
            target: 'determiningTemplatesPath',
            actions: assign({
              workspaceRoot: ({ event }) => event.output,
            }),
          },
          onError: {
            target: 'settingUpNewProject',
          },
        },
      },

      /**
       * Setup a new project when no workspace is found
       */
      settingUpNewProject: {
        initial: 'gatheringProjectInfo',
        states: {
          /**
           * Gather project name and type from CLI args or prompts
           */
          gatheringProjectInfo: {
            invoke: {
              src: 'gatherProjectInfo',
              input: ({ context }) => ({
                providedName: context.options.name,
                providedProjectType: context.options.projectType,
              }),
              onDone: {
                target: 'creatingProjectDirectory',
                actions: assign({
                  projectName: ({ event }) => event.output.projectName,
                  projectType: ({ event }) => event.output.projectType,
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
           * Create the project directory
           */
          creatingProjectDirectory: {
            invoke: {
              src: 'createProjectDirectory',
              input: ({ context }) => ({
                projectName: context.projectName!,
                projectType: context.projectType!,
              }),
              onDone: {
                target: 'handlingGitSetup',
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
           * Handle Git repository setup (clone existing or init new)
           */
          handlingGitSetup: {
            invoke: {
              src: 'handleGitSetup',
              input: ({ context }) => ({
                projectPath: context.projectPath!,
                projectType: context.projectType!,
              }),
              onDone: {
                target: '#init.determiningTemplatesPath',
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
       * Determine where templates should be stored
       */
      determiningTemplatesPath: {
        entry: assign({
          templatesPath: ({ context }) => {
            if (context.options.path) {
              return path.join(context.workspaceRoot!, context.options.path);
            }
            return path.join(context.workspaceRoot!, 'templates');
          },
        }),
        always: {
          target: 'checkingTemplatesExistence',
        },
      },

      /**
       * Check if templates folder already exists
       */
      checkingTemplatesExistence: {
        invoke: {
          src: 'checkTemplatesExistence',
          input: ({ context }) => ({
            templatesPath: context.templatesPath!,
          }),
          onDone: [
            {
              target: 'handlingExistingTemplates',
              guard: ({ event }) => event.output === true,
            },
            {
              target: 'initializingTemplates',
              guard: ({ event }) => event.output === false,
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
       * Handle case where templates folder already exists
       */
      handlingExistingTemplates: {
        invoke: {
          src: 'promptAlternateFolder',
          input: ({ context }) => ({
            templatesPath: context.templatesPath!,
            workspaceRoot: context.workspaceRoot!,
            projectType: context.projectType,
          }),
          onDone: [
            {
              target: 'creatingToolkitConfig',
              guard: ({ event }) => event.output.useAlternate === true,
              actions: assign({
                templatesPath: ({ event }) => event.output.templatesPath,
                customTemplatesPath: ({ event }) => event.output.alternateFolder,
              }),
            },
            {
              target: 'checkingDownloadOption',
              guard: ({ event }) => event.output.useAlternate === false,
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
       * Create toolkit.yaml with custom templates path
       */
      creatingToolkitConfig: {
        invoke: {
          src: 'createToolkitConfig',
          input: ({ context }) => ({
            customTemplatesPath: context.customTemplatesPath!,
            workspaceRoot: context.workspaceRoot!,
            projectType: context.projectType,
          }),
          onDone: {
            target: 'initializingTemplates',
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
       * Initialize templates folder structure
       */
      initializingTemplates: {
        invoke: {
          src: 'initializeTemplates',
          input: ({ context }) => ({
            templatesPath: context.templatesPath!,
          }),
          onDone: {
            target: 'checkingDownloadOption',
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
       * Check if templates should be downloaded
       * Uses guard to check if download flag is true (default behavior)
       */
      checkingDownloadOption: {
        always: [
          {
            target: 'downloadingTemplates',
            guard: 'shouldDownloadTemplates',
          },
          {
            target: 'completed',
          },
        ],
      },

      /**
       * Download templates from repository
       */
      downloadingTemplates: {
        invoke: {
          src: 'downloadTemplates',
          input: ({ context }) => ({
            templatesPath: context.templatesPath!,
          }),
          onDone: {
            target: 'completed',
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
    guards: {
      /**
       * Guard to check if templates should be downloaded
       * Commander --no-download flag sets download to false
       * Default behavior (no flag) is to download (download = true)
       */
      shouldDownloadTemplates: ({ context }) => {
        return context.options.download === true;
      },
    },
  },
);
