import fs from 'fs';
import { simpleGit, type SimpleGitOptions, type SimpleGit } from 'simple-git';
import { logger } from '../../utils';

export default class GitClient {
  private git: SimpleGit;

  /**
   * @param baseDir
   * @param options
   * @example new GitClient('/path/to/workspace', { baseDir: '/path/to/workspace', config: ['user.name=John Doe' })
   */
  constructor(private baseDir: string, options?: Partial<SimpleGitOptions>) {
    if (options) {
      options.baseDir = baseDir;
    }
    const path = fs.mkdirSync(baseDir, { recursive: true });
    this.git = options ? simpleGit(options) : simpleGit(baseDir);
  }

  /**
   * @returns true if the repo was created, false if it already existed
   */
  async init(repoUrl: string, alwaysPull: boolean, branch = 'main', remote = 'origin'): Promise<boolean> {
    const init = await this.git.init();

    if (!init.existing || !(await this.git.getRemotes()).some((r) => r.name === remote)) {
      await this.git.addRemote(remote, repoUrl);
    }

    if (!init.existing || alwaysPull) {
      logger.info(`pulling git repo ${repoUrl} ${remote}/${branch}`);
      logger.info(`  to ${this.baseDir}`);

      await this.pull(branch, remote);
    }

    return init.existing;
  }

  pull(branch = 'main', remote = 'origin') {
    return this.git.pull(remote, branch);
  }
}
