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
 * Each user interaction is a separate state for proper flow control
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
        initial: 'displayingHeader',
        states: {
          /**
           * Display new project setup header
           */
          displayingHeader: {
            invoke: {
              src: 'displayNewProjectHeader',
              onDone: {
                target: 'gatheringProjectName',
              },
            },
          },

          /**
           * Gather project name from CLI args or prompt user
           */
          gatheringProjectName: {
            invoke: {
              src: 'gatherProjectName',
              input: ({ context }) => ({
                providedName: context.options.name,
              }),
              onDone: {
                target: 'gatheringProjectType',
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
           * Gather project type from CLI args or prompt user
           */
          gatheringProjectType: {
            invoke: {
              src: 'gatherProjectType',
              input: ({ context }) => ({
                providedProjectType: context.options.projectType,
              }),
              onDone: {
                target: 'creatingProjectDirectory',
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
                target: 'promptingExistingRepo',
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
           * Ask if user has existing Git repository
           */
          promptingExistingRepo: {
            invoke: {
              src: 'promptExistingRepo',
              onDone: [
                {
                  target: 'promptingRepoUrl',
                  guard: ({ event }) => event.output === true,
                },
                {
                  target: 'promptingInitGit',
                  guard: ({ event }) => event.output === false,
                },
              ],
              onError: {
                target: '#init.failed',
                actions: assign({
                  error: ({ event }) => event.error as Error,
                }),
              },
            },
          },

          /**
           * Prompt for Git repository URL
           */
          promptingRepoUrl: {
            invoke: {
              src: 'promptRepoUrl',
              input: ({ context }) => ({
                projectPath: context.projectPath!,
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

          /**
           * Ask if user wants to initialize new Git repository
           */
          promptingInitGit: {
            invoke: {
              src: 'promptInitGit',
              input: ({ context }) => ({
                projectPath: context.projectPath!,
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
              target: 'promptingAlternateFolder',
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
       * Prompt user if they want alternate folder
       */
      promptingAlternateFolder: {
        invoke: {
          src: 'promptAlternateFolder',
          input: ({ context }) => ({
            templatesPath: context.templatesPath!,
          }),
          onDone: [
            {
              target: 'promptingAlternateFolderName',
              guard: ({ event }) => event.output === true,
            },
            {
              target: 'checkingDownloadOption',
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
       * Prompt for alternate folder name
       */
      promptingAlternateFolderName: {
        invoke: {
          src: 'promptAlternateFolderName',
          input: ({ context }) => ({
            workspaceRoot: context.workspaceRoot!,
            projectType: context.projectType,
          }),
          onDone: {
            target: 'creatingToolkitConfig',
            actions: assign({
              templatesPath: ({ event }) => event.output.templatesPath,
              customTemplatesPath: ({ event }) => event.output.alternateFolder,
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
