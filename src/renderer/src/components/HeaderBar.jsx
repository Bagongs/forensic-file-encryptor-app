import { useState } from 'react'
import { FaSignOutAlt } from 'react-icons/fa'
import headerImg from '../assets/images/header-full.png'
import CloseConfirmationModal from './CloseConfirmation'

export default function HeaderBar() {
  const [showCloseModal, setShowCloseModal] = useState(false)

  return (
    <>
      {/* HEADER BAR */}
      <div
        className="relative w-full h-32 bg-no-repeat bg-left"
        style={{
          backgroundImage: `url(${headerImg})`,
          backgroundSize: 'contain'
        }}
      >
        <div className="absolute right-5 top-1/2">
          <FaSignOutAlt
            onClick={() => setShowCloseModal(true)}
            className="2xl:w-7 2xl:h-7 w-5 h-5 cursor-pointer"
          />
        </div>
      </div>

      {/* MODAL */}
      <CloseConfirmationModal
        open={showCloseModal}
        onCancel={() => setShowCloseModal(false)}
        onConfirm={() => {
          window.fileEncryptor.quitApp()
        }}
      />
    </>
  )
}
