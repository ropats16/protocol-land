import { Dialog, Transition } from '@headlessui/react'
import { yupResolver } from '@hookform/resolvers/yup'
import clsx from 'clsx'
import React, { Fragment } from 'react'
import { useForm } from 'react-hook-form'
import SVG from 'react-inlinesvg'
import toast from 'react-hot-toast'
import * as yup from 'yup'
import cleanGitRef from 'clean-git-ref'

import CloseCrossIcon from '@/assets/icons/close-cross.svg'
import { Button } from '@/components/common/buttons'
import { withAsync } from '@/helpers/withAsync'

type NewBranchModal = {
  setIsOpen: (val: boolean) => void
  isOpen: boolean
  addNewBranch: (name: string) => Promise<void>
}

const schema = yup
  .object({
    name: yup
      .string()
      .transform(
        (currentValue) =>
          // https://github.com/renovatebot/renovate/blob/159acb04c72e27d167084b5a0d00b3b5f49672fe/lib/workers/repository/updates/branch-name.ts#L21
          cleanGitRef
            .clean(currentValue)
            .replace(/^\.|\.$/, '') // leading or trailing dot
            .replace(/\/\./g, '/') // leading dot after slash
            .replace(/\s/g, '') // whitespace
            .replace(/[[?:\\^~]/g, '') // massage out all these characters: : ? [ \ ^ ~
            .replace(/^-+|-+$/g, '') // replace starting or ending '-+' sequences
      )
      .required('Branch name is required')
  })
  .required()

export default function NewBranchModal({ setIsOpen, isOpen, addNewBranch }: NewBranchModal) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema)
  })

  function closeModal() {
    setIsOpen(false)
  }

  async function handleCreateBtnClick(data: yup.InferType<typeof schema>) {
    setIsSubmitting(true)

    const { name } = data
    const { error } = await withAsync(() => addNewBranch(name))

    if (!error) {
      setIsOpen(false)
      resetField('name')
    } else {
      toast.error((error as Error)?.message || 'Failed to create new branch.')
    }
    setIsSubmitting(false)
    // const owner = userAddress || 'Protocol.Land user'

    //   if (result.id) {
    //     // navigate(`/repository/${result.id}`)
    //   }
    // }
  }

  return (
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
              <Dialog.Panel className="w-full max-w-[368px] transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="w-full flex justify-between align-middle">
                  <Dialog.Title as="h3" className="text-xl font-medium text-gray-900">
                    Create a new Branch
                  </Dialog.Title>
                  <SVG onClick={closeModal} src={CloseCrossIcon} className="w-6 h-6 cursor-pointer" />
                </div>
                <div className="mt-6 flex flex-col gap-2.5">
                  <div>
                    <label htmlFor="title" className="block mb-1 text-sm font-medium text-gray-600">
                      Name
                    </label>
                    <input
                      type="text"
                      {...register('name')}
                      className={clsx(
                        'bg-white border-[1px] text-gray-900 text-base rounded-lg hover:shadow-[0px_2px_4px_0px_rgba(0,0,0,0.10)] focus:border-primary-500 focus:border-[1.5px] block w-full px-3 py-[10px] outline-none',
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      )}
                      placeholder="feature/my-cool-feature"
                    />
                    {errors.name && <p className="text-red-500 text-sm italic mt-2">{errors.name?.message}</p>}
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    disabled={Object.keys(errors).length > 0 || isSubmitting}
                    className="w-full justify-center font-medium text-base"
                    onClick={handleSubmit(handleCreateBtnClick)}
                    variant="primary-solid"
                    isLoading={isSubmitting}
                  >
                    Create
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
