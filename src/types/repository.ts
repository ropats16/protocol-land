import { User } from './user'

export type PrivateState = {
  iv: string
  keys: Record<string, string>
  version: string
}

export type Repo = {
  id: string
  name: string
  description: string
  defaultBranch: string
  dataTxId: string
  owner: string
  pullRequests: PullRequest[]
  issues: Issue[]
  contributors: string[]
  deployments: Deployment[]
  deploymentBranch: string
  forks: Forks
  fork: boolean
  parent: string | null
  timestamp: number
  private: boolean
  privateStateTxId?: string
}

export type ForkMetaData = Pick<Repo, 'id' | 'name' | 'owner' | 'timestamp'>

export type Forks = Record<string, ForkMetaData>

export type Deployment = {
  txId: string
  branch: string
  deployedBy: string
  commitOid: string
  commitMessage: string
  timestamp: number
}

export type PullRequest = {
  id: number
  repoId: string
  title: string
  description: string
  baseBranch: string
  compareBranch: string
  baseBranchOid: string
  author: string
  status: PullRequestStatus
  reviewers: Reviewer[]
  timestamp: number
  baseRepo: {
    repoName: string
    repoId: string
  }
  compareRepo: {
    repoName: string
    repoId: string
  }
}

export type Issue = {
  id: number
  repoId: string
  title: string
  description: string
  author: string
  status: IssueStatus
  timestamp: number
  completedTimestamp?: number
  assignees: string[]
  activities: IssueActivity[]
  bounties: Bounty[]
}

export type Bounty = {
  id: number
  amount: number
  expiry: number
  status: BountyStatus
  paymentTxId: string | null
  timestamp: number
}

export type IssueActivity = IssueActivityStatus | IssueActivityComment

export type BaseActivity = {
  type: ActivityType
  author: string
  timestamp: number
}

export interface IssueActivityStatus extends BaseActivity {
  status: IssueStatus | 'REOPEN'
}

export interface IssueActivityComment extends BaseActivity {
  description: string
}

export type MergeResult = {
  oid?: string // The SHA-1 object id that is now at the head of the branch. Absent only if `dryRun` was specified and `mergeCommit` is true.
  alreadyMerged?: boolean // True if the branch was already merged so no changes were made
  fastForward?: boolean // True if it was a fast-forward merge
  mergeCommit?: boolean // True if merge resulted in a merge commit
  tree?: string // The SHA-1 object id of the tree resulting from a merge commit
}

export type Reviewer = {
  address: string
  approved: boolean
}

export type PullRequestStatus = 'OPEN' | 'CLOSED' | 'MERGED'

export type ActivityType = 'STATUS' | 'COMMENT'

export type IssueStatus = 'OPEN' | 'COMPLETED'

export type BountyStatus = 'ACTIVE' | 'CLAIMED' | 'EXPIRED' | 'CLOSED'

export type WarpReadState = {
  cachedValue: {
    state: ContractState
  }
}

export type ContractState = {
  users: Record<string, User>
  repos: Repositories
  canEvolve: boolean
  evolve: null | any
  owner: string
}

export type Repositories = Record<string, Repo>
