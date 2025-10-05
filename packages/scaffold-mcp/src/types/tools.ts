import { z } from 'zod';

export const scaffoldArgsSchema = z.object({
  appName: z.string().min(1).describe('The name of the application to scaffold'),
});

export type ScaffoldArgs = z.infer<typeof scaffoldArgsSchema>;

export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  execute: (args: unknown) => Promise<string>;
}
