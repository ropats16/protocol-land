import { Dialog, Transition } from '@headlessui/react'
import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { Fragment } from 'react'
import toast from 'react-hot-toast'
import SVG from 'react-inlinesvg'

import CloseCrossIcon from '@/assets/icons/close-cross.svg'
import { Button } from '@/components/common/buttons'
import { withAsync } from '@/helpers/withAsync'
import { getDomainStatus, updateArNSDomain } from '@/lib/dragondeploy/arns'
import { useGlobalStore } from '@/stores/globalStore'

export default function ArNSDomainModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [isOnline, setIsOnline] = useState(false)
  const [isUpdated, setIsUpdated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [intervalValue, setIntervalValue] = useState<number>()

  const [selectedRepo, updateDomain] = useGlobalStore((state) => [
    state.repoCoreState.selectedRepo.repo,
    state.repoCoreActions.updateDomain
  ])

  const deploymentCounts = selectedRepo?.deployments?.length ?? 0
  const deployment = selectedRepo?.deployments?.[deploymentCounts - 1]
  const domain = selectedRepo?.domains?.[0]
  const updateNeeded = deployment?.txId !== domain?.txId

  function closeModal() {
    setIsOpen(false)
  }

  async function handleUpdateDomain() {
    if (!domain || !deployment) return

    try {
      setIsLoading(true)
      const updateArNSDomainResult = await withAsync(() =>
        updateArNSDomain({ antContract: domain.contractTxId, transactionId: deployment.txId })
      )

      if (updateArNSDomainResult.error || !updateArNSDomainResult.response?.success) {
        throw updateArNSDomainResult.error
      }

      const updateDomainResult = await withAsync(() =>
        updateDomain({ name: domain.name, contractTxId: domain.contractTxId, txId: deployment.txId })
      )

      if (updateDomainResult.error) {
        throw updateDomainResult.error
      }

      setIsUpdated(false)

      toast.success('Updated domain to the latest deployment')
    } catch (error) {
      toast.error((error as any)?.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function checkDomain() {
    if (domain) {
      const { response, error } = await withAsync(() => getDomainStatus(domain))
      if (!error) {
        setIsOnline(!!response?.isOnline)
        setIsUpdated(!!response?.isUpdated)
      }
      return response
    }
  }

  useEffect(() => {
    if (isOpen && domain) {
      checkDomain()
      const interval = setInterval(async (): Promise<void> => {
        const response = await checkDomain()
        if (response && response.isOnline && response.isUpdated) {
          clearInterval(interval)
        }
      }, 60000)

      setIntervalValue(interval as unknown as number)
    }

    return () => clearInterval(intervalValue)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen && intervalValue) {
      clearInterval(intervalValue)
    }
  }, [isOpen])

  return (
    <>
      <Button variant="primary-solid" onClick={() => setIsOpen(true)}>
        ArNS Domain
      </Button>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="w-full flex justify-between align-middle">
                    <Dialog.Title as="h3" className="text-xl font-medium text-gray-900">
                      ArNS Domain
                    </Dialog.Title>
                    <SVG onClick={closeModal} src={CloseCrossIcon} className="w-6 h-6 cursor-pointer" />
                  </div>
                  <Dialog.Description className="mt-4">
                    <div className="flex justify-center items-center w-full">
                      <div className="bg-white rounded-lg p-1 w-full">
                        <p className="text-gray-600">Update ArNS domain to latest repo deployment</p>
                        <div className="flex flex-col gap-2 justify-between mt-4">
                          <div className="flex gap-1">
                            <a
                              className="text-primary-600 hover:underline hover:text-primary-700"
                              href={`https://${domain?.name}.ar-io.dev`}
                              target="_blank"
                            >
                              {domain?.name}.ar-io.dev
                            </a>
                            <div
                              className={clsx(
                                'h-[10px] w-[10px] rounded-full border border-slate-300',
                                isOnline ? 'bg-green-600' : 'bg-red-600'
                              )}
                            ></div>
                          </div>
                          {!isUpdated && isOnline && <span>Update in progress...</span>}
                        </div>
                        <div className="flex flex-col gap-3 justify-center mt-6">
                          <div className="flex gap-2">
                            <Button
                              className="w-full flex justify-center"
                              variant="primary-solid"
                              isLoading={isLoading}
                              disabled={isLoading || !updateNeeded}
                              loadingText="Updating..."
                              onClick={handleUpdateDomain}
                            >
                              Update
                            </Button>
                            <Button
                              className="w-full flex justify-center"
                              variant="secondary"
                              onClick={() => closeModal()}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Dialog.Description>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}
