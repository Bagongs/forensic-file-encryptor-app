import { FaSignOutAlt } from 'react-icons/fa'
import headerImg from '../assets/images/header-full.png'

export default function HeaderBar() {
  return (
    <div
      className="relative w-full h-32 bg-no-repeat bg-left"
      style={{
        backgroundImage: `url(${headerImg})`,
        backgroundSize: 'contain'
      }}
    >
      <div className="absolute right-5 top-1/2">
        <FaSignOutAlt
          onClick={() => window.fileEncryptor.quitApp()}
          className="2xl:w-7 2xl:h-7 w-5 h-5 cursor-pointer"
        />
      </div>
    </div>
  )
}
