import { useActiveAddress, useConnection, useStrategy } from '@arweave-wallet-kit-beta/react'
import { Menu, Transition } from '@headlessui/react'
import { Fragment, useEffect, useRef } from 'react'
import { AiOutlineProfile } from 'react-icons/ai'
import { BiLogOutCircle } from 'react-icons/bi'
import { FaUser } from 'react-icons/fa'
import { FiChevronDown } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/common/buttons'
import { trackGoogleAnalyticsEvent } from '@/helpers/google-analytics'
import { shortenAddress } from '@/helpers/shortenAddress'
import { useGlobalStore } from '@/stores/globalStore'

export default function UserProfileButton() {
  const navigate = useNavigate()
  const [login, logout] = useGlobalStore((state) => [state.authActions.login, state.authActions.logout])
  const { connected, connect, disconnect } = useConnection()
  const address = useActiveAddress()
  const strategy = useStrategy()

  const connectedRef = useRef(false)

  useEffect(() => {
    if (connected && address && strategy) {
      login({
        isLoggedIn: true,
        address,
        method: strategy
      })

      connectedRef.current = true

      trackGoogleAnalyticsEvent('Auth', 'Post connect button click', 'Login')
    }

    if (connectedRef.current === true && connected === false) {
      trackGoogleAnalyticsEvent('Auth', 'Post logout button click', 'Logout')

      logout()
      connectedRef.current = false
    }
  }, [connected, address, strategy])

  function openProfileModal() {
    navigate(`/user/${address}`)
  }

  async function handleConnectBtnClick() {
    connect()

    trackGoogleAnalyticsEvent('Auth', 'Connect button click', 'Connect Button')
  }

  async function handleLogoutBtnClick() {
    trackGoogleAnalyticsEvent('Auth', 'Logout button click', 'Logout Button')

    disconnect()
  }

  if (!connected || !address)
    return (
      <Button
        className="rounded-[20px] font-medium !px-4 py-[10px]"
        variant="primary-solid"
        onClick={handleConnectBtnClick}
      >
        Connect
      </Button>
    )

  return (
    <Menu as="div" className="relative inline-block text-left">
      {({ open }) => (
        <>
          <div>
            <Menu.Button
              className={`border-[1.5px] border-primary-600 rounded-[8px] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.05)] inline-flex w-full justify-between items-center px-4 h-10 ${
                open ? 'bg-primary-50' : 'bg-white'
              } tracking-wide text-primary-700  font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75`}
            >
              <FaUser className="h-4 w-4" />
              <span className="ml-2">{shortenAddress(address!, 4)}</span>
              {open && <FiChevronDown className="ml-2 -mr-1 h-5 w-5 rotate-180" aria-hidden="true" />}
              {!open && <FiChevronDown className="ml-2 -mr-1 h-5 w-5" aria-hidden="true" />}
            </Menu.Button>
          </div>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute z-10 right-0 mt-2 w-56 origin-top-right divide-y divide-gray-200 divide-opacity-60 rounded-md bg-[white] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.10)] border-[1px] border-gray-300 focus:outline-none">
              <div className="px-1 py-1 ">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={`${
                        active ? 'bg-primary-50 text-gray-900' : 'text-gray-900'
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      onClick={openProfileModal}
                    >
                      <AiOutlineProfile className="mr-2 h-5 w-5" aria-hidden="true" />
                      Profile
                    </button>
                  )}
                </Menu.Item>
              </div>

              <div className="px-1 py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      className={`${
                        active ? 'bg-primary-50 text-gray-900' : 'text-gray-900'
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      onClick={handleLogoutBtnClick}
                    >
                      <BiLogOutCircle className="mr-2 h-5 w-5" aria-hidden="true" />
                      Logout
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </>
      )}
    </Menu>
  )
}