import React from 'react'
import { useParams } from 'react-router'

import { getAllBranches, getCurrentBranch } from '@/lib/git/branch'
import { fsWithName } from '@/lib/git/helpers/fsWithName'
import { useGlobalStore } from '@/stores/globalStore'

export default function useBranch() {
  const { txid } = useParams()
  const [userRepo] = useGlobalStore((state) => [state.getUserRepositoryMetaByTxId(txid!)])
  const [branches, setBranches] = React.useState<string[]>([])
  const [currentBranch, setCurrentBranch] = React.useState('master')

  React.useEffect(() => {
    if (userRepo) {
      listBranches()
      fetchCurrentBranch()
    }
  }, [userRepo])

  async function listBranches() {
    if (!userRepo) return

    const { name } = userRepo

    const fs = fsWithName(name)
    const dir = `/${name}`

    const branchList = await getAllBranches({ fs, dir })

    setBranches([...branchList])
  }
  async function fetchCurrentBranch() {
    if (!userRepo) return

    const { name } = userRepo

    const fs = fsWithName(name)
    const dir = `/${name}`

    const { result, error } = await getCurrentBranch({ fs, dir })

    if (error || !result) return

    setCurrentBranch(result)
  }

  return { branches, currentBranch }
}
