import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

// eslint-disable-next-line react/prop-types
export default function LicenseGate({ children }) {
  const [licenseData, setLicenseData] = useState(null)
  const location = useLocation()

  useEffect(() => {
    async function checkLicense() {
      try {
        const res = await window.license.getInfo()
        setLicenseData(res)
      } catch (e) {
        console.error('Failed to load license:', e)
      }
    }

    checkLicense()
  }, [location.pathname]) // rerun on page change

  if (!licenseData) {
    return (
      <div className="bg-black h-screen flex items-center justify-center">
        <h1 className="text-white text-xl">Checking License...</h1>
      </div>
    )
  }

  const { now, end_date } = licenseData.data

  const nowDate = new Date(now)
  const endDate = new Date(end_date)

  const expired = nowDate >= endDate

  console.log('License:', { nowDate, endDate, expired })

  if (expired) {
    return (
      <div className="bg-black h-screen flex items-center justify-center">
        <h1 className="text-white text-3xl font-bold font-[Aldrich] uppercase">License Expired</h1>
        {/* Optional: auto quit */}
        {/* window.system.quitApp() */}
      </div>
    )
  }

  return children
}
