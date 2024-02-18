import { ToolContext } from '../tools/ToolTypes';
import { get_directory_tree } from '../tools/impl/get_directory_tree';
import { logger } from '../utils';

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
      type: 'content';
      /** The content as a string of markdown source */
      content: string; // || MarkdownString;
    }
  | {
      /**
       * Represents a piece of the chat response's content that is resolved asynchronously.
       * It is rendered immediately with a placeholder, which is replaced once the full content is available.
       * @deprecated // Apparently this one type is going away
       * https://github.com/microsoft/vscode/blob/96bc006c927c18fe87e15a824c0f2a4349104013/src/vs/workbench/api/common/extHostChatAgents2.ts#L135
       */
      type: 'task';
      /** The markdown string to be rendered immediately. */
      placeholder: string;
      /** A Thenable resolving to the real content.
       *  The placeholder will be replaced with this content once it's available.
       *  eg:
       *    resolvedContent: Promise.resolve({ content: response.content })
       *    resolvedContent: Promise.resolve({ treeData: { label: "", uri: vscode.Uri.file(""), children: []} }) */
      resolvedContent: Promise<unknown>; // ChatAgentContent | ChatAgentFileTree>;
    }
  | {
      /** Represents a tree, such as a file and directory structure, rendered in the chat response
       *   eg: {treeData: { label: "", uri: vscode.Uri.file(""), children: []}}  */
      type: 'fileTree';
      /** The markdown string to be rendered immediately. */
      treeData: unknown; // ChatAgentFileTreeData;
    }
  | {
      /** Document references that should be used by the MappedEditsProvider */
      type: 'usedContext';
      /** Document references that should be used by the MappedEditsProvider */
      documents: unknown[]; // ChatAgentDocumentContext[];
    }
  | {
      /** Indicates a piece of content that was used by the chat agent while processing the request.
       *  Will be displayed to the user. */
      type: 'contentReference';
      /** The resource that was referenced. */
      reference: unknown; // Uri | Location;
    }
  | {
      /** A reference to a piece of content that will be rendered inline with the markdown content. */
      type: 'inlineContentReference';
      /** The resource that was referenced. */
      inlineReference: unknown; // Uri | Location;
      /** An alternate title for the resource. */
      title: string;
    }
  | {
      // Requires chatAgents2Additions in package.json
      type: 'agentDetection';
      agentName: string;
      command: string;
    };

export type RoutingContextValue = string | string[] | { [key: string]: RoutingContextValue };
export type RoutingContext = Record<string, RoutingContextValue>;

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

  public getDirectoryTree(): string {
    return get_directory_tree(this.workspaceFolder);
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
