import { BiCodeAlt } from 'react-icons/bi'
import { FiGitCommit, FiGitPullRequest, FiSettings } from 'react-icons/fi'

import CodeTab from '../components/tabs/code-tab'
import CommitsTab from '../components/tabs/commits-tab'
import PullRequestsTab from '../components/tabs/pull-requests-tab'
import SettingsTab from '../components/tabs/settings-tab'

export const rootTabConfig = [
  {
    title: 'Code',
    Component: CodeTab,
    Icon: BiCodeAlt
  },
  {
    title: 'Commits',
    Component: CommitsTab,
    Icon: FiGitCommit
  },
  {
    title: 'Pull Requests',
    Component: PullRequestsTab,
    Icon: FiGitPullRequest
  },
  {
    title: 'Settings',
    Component: SettingsTab,
    Icon: FiSettings
  }
]
