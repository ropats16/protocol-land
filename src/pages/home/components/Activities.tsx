import { useEffect, useState } from 'react'

import { Button } from '@/components/common/buttons'
import { CONTRACT_TX_ID } from '@/helpers/constants'
import { withAsync } from '@/helpers/withAsync'
import ForkModal from '@/pages/repository/components/ForkModal'
import {
  Activity,
  BountyActivityType,
  DeploymentActivityType,
  DomainActivityType,
  Filters,
  Interactions,
  IssueActivityType,
  Paging,
  PullRequestActivityType,
  RepositoryActivityType,
  ValidityResponse
} from '@/types/explore'
import { Repo } from '@/types/repository'

import BountyActivity from './BountyActivity'
import DeploymentActivity from './DeploymentActivity'
import DomainActivity from './DomainActivity'
import IssueActivity from './IssueActivity'
import PullRequestActivity from './PullRequestActivity'
import RepositoryActivity from './RepositoryActivity'

const repositoryInteractionFunctions = [
  'initialize',
  'forkRepository',
  'acceptContributorInvite',
  'addContributor',
  'cancelContributorInvite',
  'inviteContributor',
  'rejectContributorInvite',
  'updatePrivateStateTx',
  'updateRepositoryDetails',
  'updateRepositoryTxId'
]

const deploymentInteractionFunctions = ['addDeployment']

const domainInteractionFunctions = ['addDomain', 'updateDomain']

const issueInteractionFunctions = [
  'createIssue',
  // 'addAssigneeToIssue',
  // 'addCommentToIssue',
  // 'updateIssueDetails',
  'updateIssueStatus'
]

const pullRequestInteractionFunctions = [
  // 'addCommentToPR',
  // 'addReviewersToPR',
  // 'approvePR',
  'createPullRequest',
  // 'linkIssueToPR',
  // 'updatePullRequestDetails',
  'updatePullRequestStatus'
]

const bountyInteractionFunctions = ['createNewBounty', 'updateBounty']

const ACTIVITY_TO_COMPONENT = {
  REPOSITORY: RepositoryActivity,
  ISSUE: IssueActivity,
  PULL_REQUEST: PullRequestActivity,
  BOUNTY: BountyActivity,
  DEPLOYMENT: DeploymentActivity,
  DOMAIN: DomainActivity
}

interface ActivitiesProps {
  filters: Filters
}

export default function Activities({ filters }: ActivitiesProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [activities, setActivities] = useState<Activity[]>([])
  const [repo, setRepo] = useState<Repo>()
  const [isForkModalOpen, setIsForkModalOpen] = useState(false)

  function getValueFromTags(tags: Array<{ name: string; value: string }>, name: string) {
    const tag = tags.find((tag) => tag.name === name)

    return tag ? tag.value : ''
  }

  async function fetchActivities(page?: number) {
    setIsLoading(true)
    const { error, response } = await withAsync(() =>
      fetch(
        `https://gw.warp.cc/sonar/gateway/interactions-sonar?contractId=${CONTRACT_TX_ID}&limit=15&totalCount=true&page=${
          page ?? currentPage
        }`
      )
    )

    if (error || !response) {
      setIsLoading(false)
      return
    }

    const { paging, interactions } = (await response.json()) as { paging: Paging; interactions: Interactions }

    const { response: validityResponse, error: validityError } = await withAsync(() =>
      fetch(
        `https://dre-1.warp.cc/contract?id=${CONTRACT_TX_ID}&validity=true&errorMessages=true&limit=15&page=${
          page ?? currentPage
        }`
      )
    )

    if (validityError || !validityResponse) {
      setIsLoading(false)
      return
    }

    setHasNextPage(paging.pages !== currentPage)

    const { validity, state } = (await validityResponse.json()) as ValidityResponse
    const validInteractions = interactions
      .filter(({ interaction }) => validity[interaction.id])
      .map(({ interaction }) => ({
        timestamp: +interaction.block.timestamp,
        owner: interaction.owner.address,
        input: JSON.parse(getValueFromTags(interaction.tags, 'Input'))
      }))

    let allActivities: Activity[] = []

    if (filters.Repositories) {
      const repositoryActivities = validInteractions
        .filter((interaction) => repositoryInteractionFunctions.includes(interaction.input.function))
        .map((interaction) => {
          const { payload } = interaction.input
          const created = ['forkRepository', 'initialize'].includes(interaction.input.function)
          return {
            type: 'REPOSITORY',
            repo: state.repos[payload.id ?? payload.repoId],
            created,
            timestamp: interaction.timestamp
          } as RepositoryActivityType
        })
      allActivities = [...allActivities, ...repositoryActivities]
    }

    if (filters.Issues) {
      const issueActivities = validInteractions
        .filter((interaction) => issueInteractionFunctions.includes(interaction.input.function))
        .map((interaction) => {
          const { payload } = interaction.input
          const repo = state.repos[payload.repoId]
          const created = interaction.input.function === 'createIssue'
          const issue = created
            ? {
                id: '',
                repoId: repo.id,
                title: payload.title,
                description: payload.description ?? '',
                author: interaction.owner,
                status: 'OPEN',
                timestamp: interaction.timestamp * 1000,
                assignees: [],
                activities: [],
                bounties: [],
                linkedPRIds: []
              }
            : repo.issues[+payload.issueId - 1]
          return {
            type: 'ISSUE',
            repo,
            issue: {
              ...issue,
              timestamp: interaction.timestamp * 1000,
              author: interaction.owner,
              status: created || payload.status === 'REOPEN' ? 'OPEN' : 'COMPLETED'
            },
            created,
            timestamp: interaction.timestamp
          } as IssueActivityType
        })
      allActivities = [...allActivities, ...issueActivities]
    }

    if (filters['Pull Requests']) {
      const pullRequestActivities = validInteractions
        .filter((interaction) => pullRequestInteractionFunctions.includes(interaction.input.function))
        .map((interaction) => {
          const { payload } = interaction.input
          const repo = state.repos[payload.repoId]
          const created = interaction.input.function === 'createPullRequest'
          const pullRequest = created
            ? {
                id: '',
                repoId: payload.repoId,
                title: payload.title,
                description: payload.description ?? '',
                baseBranch: payload.baseBranch,
                compareBranch: payload.compareBranch,
                baseBranchOid: payload.baseBranchOid,
                author: interaction.owner,
                status: 'OPEN',
                reviewers: [],
                activities: [],
                timestamp: interaction.timestamp * 1000,
                baseRepo: payload.baseRepo,
                compareRepo: payload.compareRepo
              }
            : repo.pullRequests[+payload.prId - 1]
          return {
            type: 'PULL_REQUEST',
            repo,
            pullRequest: {
              ...pullRequest,
              timestamp: interaction.timestamp * 1000,
              author: interaction.owner,
              status: created || payload.status === 'REOPEN' ? 'OPEN' : payload.status
            },
            created,
            timestamp: interaction.timestamp
          } as PullRequestActivityType
        })
      allActivities = [...allActivities, ...pullRequestActivities]
    }

    if (filters.Bounties) {
      const bountiesActivities = validInteractions
        .filter((interaction) => bountyInteractionFunctions.includes(interaction.input.function))
        .map((interaction) => {
          const { payload } = interaction.input
          const repo = state.repos[payload.repoId]
          const issue = repo.issues[+payload.issueId - 1]
          const created = interaction.input.function === 'createNewBounty'
          const bounty = created
            ? {
                id: '',
                amount: payload.amount,
                expiry: payload.expiry,
                paymentTxId: null,
                status: 'ACTIVE',
                timestamp: interaction.timestamp * 1000
              }
            : issue.bounties[+payload.bountyId - 1]
          return {
            type: 'BOUNTY',
            repo,
            bounty,
            issue,
            created,
            timestamp: interaction.timestamp
          } as BountyActivityType
        })

      allActivities = [...allActivities, ...bountiesActivities]
    }

    if (filters.Deployments) {
      const deploymentActivities = validInteractions
        .filter((interaction) => deploymentInteractionFunctions.includes(interaction.input.function))
        .map((interaction) => {
          const { payload } = interaction.input
          const repo = state.repos[payload.id]
          const created = interaction.input.function === 'addDeployment'
          const deployment = {
            txId: payload.deployment.txId,
            branch: repo.deploymentBranch,
            deployedBy: interaction.owner,
            commitOid: payload.deployment.commitOid,
            commitMessage: payload.deployment.commitMessage,
            timestamp: interaction.timestamp * 1000
          }

          return {
            type: 'DEPLOYMENT',
            repo,
            deployment,
            created,
            timestamp: interaction.timestamp
          } as DeploymentActivityType
        })
      allActivities = [...allActivities, ...deploymentActivities]
    }

    if (filters.Domains) {
      const domainActivities = validInteractions
        .filter((interaction) => domainInteractionFunctions.includes(interaction.input.function))
        .map((interaction) => {
          const { payload } = interaction.input
          const repo = state.repos[payload.id]
          const created = interaction.input.function === 'addDomain'
          const domain = created
            ? {
                txId: payload.domain.txId,
                name: payload.domain.name,
                contractTxId: payload.domain.contractTxId,
                controller: interaction.owner,
                timestamp: interaction.timestamp * 1000
              }
            : repo.domains.find((d) => d.name === payload.domain.name || d.contractTxId === payload.domain.contractTxId)

          return {
            type: 'DOMAIN',
            repo,
            domain,
            created,
            timestamp: interaction.timestamp
          } as DomainActivityType
        })
      allActivities = [...allActivities, ...domainActivities]
    }

    // Filter out all private repos activities
    allActivities = allActivities.filter((activity) => !activity?.repo?.private)

    setActivities((previousActivities) =>
      [...previousActivities, ...allActivities].sort((a, b) => b.timestamp - a.timestamp)
    )

    setCurrentPage((page) => page + 1)
    setIsLoading(false)
  }

  useEffect(() => {
    setCurrentPage(1)
    setHasNextPage(true)
    setActivities([])
    fetchActivities(1)
  }, [filters])

  return (
    <div className="w-full">
      <div className="flex flex-col gap-8">
        {activities.map((activity, index) => {
          const ActivityComponent = ACTIVITY_TO_COMPONENT[activity.type]
          return (
            <ActivityComponent
              key={`activity-${index}`}
              // @ts-ignore
              activity={activity}
              setIsForkModalOpen={setIsForkModalOpen}
              setRepo={setRepo}
            />
          )
        })}
      </div>
      {hasNextPage && (
        <div className="w-full flex mt-4 justify-center" onClick={() => fetchActivities()}>
          <Button
            variant="primary-outline"
            loadingText={activities.length === 0 ? 'Loading' : 'Loading more'}
            isLoading={isLoading}
            disabled={isLoading || !hasNextPage}
          >
            Load more
          </Button>
        </div>
      )}
      {repo && <ForkModal isOpen={isForkModalOpen} setIsOpen={setIsForkModalOpen} repo={repo} />}
    </div>
  )
}
