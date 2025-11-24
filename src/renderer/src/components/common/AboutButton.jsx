import { MdOutlineInfo } from 'react-icons/md'
import { useLocation, useNavigate } from 'react-router-dom'
import aboutBg from '../../assets/images/bg-about_button.svg'

export default function AboutButton() {
  const location = useLocation()
  const navigate = useNavigate()

  // icon menjadi kuning jika sedang di halaman /about
  const isActive = location.pathname === '/about'
  const iconColor = isActive ? '#EDC702' : '#FFFFFF'

  return (
    <button
      onClick={() => navigate('/about')}
      className="fixed bottom-10 right-10 w-[72px] h-[72px] flex items-center justify-center z-50"
      style={{
        backgroundImage: `url(${aboutBg})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center'
      }}
    >
      <MdOutlineInfo size={32} color={iconColor} />
    </button>
  )
}
