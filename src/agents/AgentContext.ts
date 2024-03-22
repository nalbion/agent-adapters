import { ToolContext } from '../tools/ToolTypes';
import { get_directory_tree } from '../tools/impl/get_directory_tree';
import { logger } from '../utils/Logger';

interface Disposable {
  dispose(): any;
}

export interface Event<T> {
  /**
   * A function that represents an event to which you subscribe by calling it with
   * a listener function as argument.
   *
   * @param listener The listener function will be called when the event happens.
   * @param thisArgs The `this`-argument which will be used when calling the event listener.
   * @param disposables An array to which a {@link Disposable} will be added.
   * @returns A disposable which unsubscribes the event listener.
   */
  (listener: (e: T) => any, thisArgs?: any, disposables?: Disposable[]): Disposable;
}

export interface CancellationToken {
  isCancellationRequested: boolean;
  onCancellationRequested: Event<any>;
}

/** See also vscode.ChatAgentProgress */
export type ProgressData =
  | {
      /** A piece of the chat response's content.
       *  Will be merged with other progress pieces as needed, and rendered as markdown. */
      type: 'markdown';
      content: string;
      // || MarkdownString {value: string, isTruested?: boolean | {enabledCommands: string[]}, supportThemeIcons?: boolean, supportHtml?: boolean, baseUri?: Uri};
    }
  | {
      type: 'progress';
      content: string;
    }
  | {
      /** An anchor is an inline reference to some type of resource */
      type: 'anchor';
      uri: string;
      title?: string;
      range?: { start: { line: number; character: number }; end: { line: number; character: number } };
    }
  | {
      /** Offer a button for the user to execute a command */
      type: 'button';
      command: { title: string; command: string; tooltip?: string; arguments?: any[] };
    }
  | {
      /** Automatically execute a command */
      type: 'command';
      command: { title: string; command: string; arguments?: any[] };
    }
  | {
      /** Represents a tree, such as a file and directory structure, rendered in the chat response */
      type: 'fileTree';
      /** {name: string, children?: [{name, children}, ...]} */
      treeData: TreeData;
    }
  | {
      /** Indicates a piece of content that was used by the chat agent while processing the request.
       *  NOT rendered inline with response */
      type: 'reference';
      uri: string;
      range?: { start: { line: number; character: number }; end: { line: number; character: number } };
    };
// | {
//     // Requires chatAgents2Additions in package.json
//     type: 'agentDetection';
//     agentName: string;
//     command: string;
// ;

export type TreeData = { name: string; children?: TreeData[] };

export type RoutingContextValue =
  | string
  | string[]
  | undefined
  | {
      [key: string]: RoutingContextValue;
    };
export type RoutingContext = Record<string, RoutingContextValue> & { modules?: RoutingContextValue[] };

export class AgentContext implements ToolContext {
  routing: RoutingContext = {};

  constructor(
    public workspaceFolder = process.cwd(),
    public askForUserPermission: (message: string) => Promise<boolean> = async (message) => {
      logger.info(message);
      logger.warn('askForUserPermission not implemented, allowing by default.');
      return true;
    },
    public cancellation: CancellationToken = {
      isCancellationRequested: false,
      onCancellationRequested: () => ({
        dispose: () => null,
      }),
    },
  ) {}

  public onProgress(_progressData: ProgressData): void {}

  public formatError(error: string): string {
    return error;
  }

  public getDirectoryTree(depth?: number): string {
    return get_directory_tree(this.workspaceFolder, depth);
  }

  mergeRoutingContext(delta: RoutingContext) {
    const mergedContext = { ...this.routing };

    Object.keys(delta).forEach((key) => {
      if (mergedContext.hasOwnProperty(key)) {
        // Merge arrays and remove duplicates
        const mergedValue = mergedContext[key];
        const deltaValue = delta[key];
        if (Array.isArray(mergedValue) && Array.isArray(deltaValue)) {
          mergedContext[key] = Array.from(new Set([...mergedValue, ...deltaValue]));
        } else if (typeof mergedValue === 'object' && typeof deltaValue === 'object') {
          mergedContext[key] = { ...mergedValue, ...deltaValue };
        } else {
          mergedContext[key] = deltaValue;
        }
      } else {
        // Add new key and value
        mergedContext[key] = delta[key];
      }
    });

    this.routing = mergedContext;
    return mergedContext;
  }
}
