import { IoIosArrowRoundBack } from 'react-icons/io'
import { useNavigate } from 'react-router-dom'

import logo from '../assets/images/icon.svg'
import licenseBg from '../assets/images/bg-license.svg'

export default function AboutPage() {
  const navigate = useNavigate()

  return (
    <>
      {/* BACK + TITLE */}
      <div className="flex items-center gap-3 px-[51px] pt-[46px]">
        <button
          onClick={() => navigate(-1)}
          className="text-[#EDC702] hover:text-[#EDC702]/80 transition"
        >
          <IoIosArrowRoundBack size={42} />
        </button>

        <h1 className="text-white text-2xl tracking-wide font-semibold">ABOUT</h1>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 w-full flex flex-col items-center justify-start pt-10">
        {/* LOGO */}
        <img
          src={logo}
          alt="Encryptor Logo"
          className="w-[197px] h-60 object-contain mb-6 select-none"
          draggable={false}
        />

        {/* TITLE */}
        <h1 className="text-[#EDC702] text-5xl font-bold tracking-wide mb-10 text-center">
          ENCRYPTOR ANALYTICS PLATFORM
        </h1>

        {/* LICENSE CARD */}
        <div
          className="w-[580px] h-[130px] flex items-center justify-center select-none"
          style={{
            backgroundImage: `url(${licenseBg})`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center'
          }}
        >
          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[#EDC702] font-bold text-2xl tracking-tight">
              SECURE ACCESS GATEWAY
            </span>

            <span className="text-[#F4F6F8] text-2xl font-medium mt-4 tracking-wide">
              GS26-CGSY-26AG-V02R
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
