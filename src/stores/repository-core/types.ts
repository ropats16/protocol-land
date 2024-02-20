import { UserCommit, UserContributionData, UserPROrIssue } from '@/lib/user'
import { CommitResult } from '@/types/commit'
import { Deployment, Domain, GithubSync, Repo } from '@/types/repository'

export interface RepoCoreSlice {
  repoCoreState: RepoCoreState
  repoCoreActions: RepoCoreActions
}

export type RepoCoreState = {
  selectedRepo: {
    status: ApiStatus
    error: unknown | null
    repo: Repo | null
    statistics: {
      commits: UserCommit[]
      pullRequests: UserPROrIssue[]
      issues: UserPROrIssue[]
    }
    isInvitedContributor: boolean
    isPrivateRepo: boolean
  }
  parentRepo: {
    status: ApiStatus
    error: unknown | null
    repo: Repo | null
  }
  forkRepo: {
    status: ApiStatus
    error: unknown | null
    repo: Repo | null
  }
  git: {
    status: ApiStatus
    error: unknown | null
    rootOid: string
    currentOid: string
    parentsOidList: string[]
    fileObjects: FileObject[]
    commits: CommitResult[]
    commitSourceBranch: string
    isCreateNewFile: boolean
  }
}

export type RepoCoreActions = {
  updateRepoName: (name: string) => Promise<void>
  updateRepoDescription: (description: string) => Promise<void>
  updateRepoDeploymentBranch: (deploymentBranch: string) => Promise<void>
  getGitHubPAT: () => Promise<string>
  updateGithubSync: (githubSync: GithubSync) => Promise<void>
  githubSyncAllowPending: () => Promise<void>
  triggerGithubSync: (options?: { manualTrigger?: boolean; forcePush?: boolean }) => Promise<void>
  inviteContributor: (address: string) => Promise<{ status: boolean; response?: any } | void>
  addDeployment: (
    deployment: Omit<Deployment, 'deployedBy' | 'branch' | 'timestamp'>
  ) => Promise<Deployment | undefined>
  addContributor: (address: string) => Promise<void>
  acceptContributor: () => Promise<void>
  rejectContributor: () => Promise<void>
  cancelContributor: (contributor: string) => Promise<void>
  grantAccessToContributor: () => Promise<void>
  addDomain: (domain: Omit<Domain, 'timestamp'>) => Promise<void>
  updateDomain: (domain: Omit<Domain, 'controller' | 'timestamp'>) => Promise<void>
  fetchAndLoadRepository: (id: string, branchName?: string) => Promise<string>
  fetchAndLoadParentRepository: (repo: Repo) => Promise<void>
  fetchAndLoadForkRepository: (id: string) => Promise<void>
  loadFilesFromRepo: () => Promise<void>
  reloadFilesOnCurrentFolder: () => Promise<void>
  setRepoContributionStats: (data: UserContributionData) => void
  isRepoOwner: () => boolean
  isContributor: () => boolean
  reset: () => void
  git: {
    readFilesFromOid: (oid: string, prefix: string) => Promise<void>
    readFileContentFromOid: (oid: string) => Promise<Uint8Array | null>
    setCurrentOid: (oid: string) => void
    setRootOid: (oid: string) => void
    setIsCreateNewFile: (value: boolean) => void
    pushParentOid: (oid: string) => void
    popParentOid: () => string
    goBack: () => Promise<void>
    getCurrentFolderPath: () => string
    downloadRepository: () => Promise<null | undefined>
    setCommits: (commits: CommitResult[]) => void
  }
}

export type FileObject = {
  prefix: string
  oid: string
  path: string
  type: string
  parent: string
}

export type ForkRepositoryOptions = {
  name: string
  description: string
  parent: string
  dataTxId: string
}
