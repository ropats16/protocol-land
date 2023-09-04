import { CommitResult } from '@/types/commit'

export interface PullRequestSlice {
  pullRequestState: PullRequestState
  pullRequestActions: PullRequestActions
}

export type PullRequestState = {
  status: ApiStatus
  error: unknown | null
  baseBranch: string
  compareBranch: string
  commits: CommitResult[]
  fileStatuses: FileStatus[]
  reviewers: []
}

export type FileStatus = [string, number, number, number]

export type PullRequestActions = {
  setBaseBranch: (branch: string) => void
  setCompareBranch: (branch: string) => void
  setCommits: (commits: CommitResult[]) => void
  getFileStatuses: (branchA: string, branchB: string) => Promise<void>
  compareBranches: (branchA: string, branchB: string) => Promise<void>
  setDefaultBranches: () => Promise<void>
  mergePullRequest: (id: number) => Promise<void>
  closePullRequest: (id: number) => Promise<void>
}
