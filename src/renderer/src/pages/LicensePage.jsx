import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'

export default function LicenseGate() {
  const [licenseData, setLicenseData] = useState(null)
  const [backendError, setBackendError] = useState(false)

  // ===== FRONTEND HARD-CODE EXPIRED (PALING KUAT) =====
  const FRONTEND_EXPIRED_DATE = '2028-01-01'
  const frontendExpired = new Date() >= new Date(FRONTEND_EXPIRED_DATE)

  if (frontendExpired) {
    return (
      <div className="bg-black h-screen flex items-center justify-center">
        <h1 className="text-white text-3xl font-bold uppercas font-[Aldrich]">License Expired</h1>
      </div>
    )
  }

  // ===== BACKEND LICENSE CHECK =====
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    let timeoutId

    async function checkLicense() {
      try {
        timeoutId = setTimeout(() => {
          console.warn('License check timeout → continuing app...')
          setBackendError(true)
        }, 20000)

        const res = await window.license.getInfo()
        console.log('License info:', res)

        clearTimeout(timeoutId)

        if (!res || !res.data) {
          console.warn('Invalid license format → continuing app...')
          setBackendError(true)
          return
        }

        setLicenseData(res)
      } catch (e) {
        clearTimeout(timeoutId)
        console.error('Failed to load license:', e)
        setBackendError(true)
      }
    }

    checkLicense()
    return () => clearTimeout(timeoutId)
  }, [])

  // ===== LOADING SEBELUM BACKEND RESPOND =====
  if (!licenseData && !backendError) {
    return (
      <div className="h-screen flex items-center justify-center">
        <h1 className="text-white text-xl font-[Aldrich] uppercase">Connecting...</h1>
      </div>
    )
  }

  // ===== BACKEND ERROR → MASUK APLIKASI =====
  if (backendError) {
    return <Outlet />
  }

  // ===== BACKEND RESPON, VALIDASI LICENSE =====
  const { now, end_date } = licenseData.data

  const expired = new Date(now) >= new Date(end_date)

  if (expired) {
    return (
      <div className="bg-black h-screen flex items-center justify-center">
        <h1 className="text-white text-3xl font-bold uppercase font-[Aldrich]">License Expired</h1>
      </div>
    )
  }

  // ===== LICENSE VALID → MASUK APP =====
  return <Outlet />
}
