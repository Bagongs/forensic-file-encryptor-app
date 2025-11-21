/* eslint-disable react/prop-types */
import uploadIcon from '../assets/icons/upload.svg'

export default function DropZone({ onFileSelect }) {
  const handleBrowse = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xls,.xlsx,.csv,.txt'
    input.onchange = (e) => onFileSelect(e.target.files[0])
    input.click()
  }

  return (
    <div className="border border-dashed border-[#51759D] rounded-md p-10 flex flex-col items-center mb-8 bg-[#0B111A] hover:bg-[#101621] transition">
      <img src={uploadIcon} className="w-32 opacity-80 mb-4" />
      <p className="text-[18px] mb-3 font-body">Drag & Drop your file here</p>
      <button onClick={handleBrowse} className="btn-browse cursor-pointer select-none">
        Browse File
      </button>
    </div>
  )
}
