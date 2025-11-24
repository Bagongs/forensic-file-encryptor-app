/* eslint-disable react/prop-types */
export default function ConverterCard({ children }) {
  return (
    <div
      className="
        w-[991px]
        h-[900px]
        rounded-xl 
        p-10 
        items-center
        bg-linear-to-b from-[#090F18] to-[#0C1016]
        border-t border-b border-[#344865]
        text-white
      "
      style={{
        borderTopWidth: '1.5px',
        borderBottomWidth: '1.5px',
        boxShadow: '-1px -4px 13.9px 0px #4F85D180 inset',
        backgroundBlendMode: 'overlay'
      }}
    >
      {children}
    </div>
  )
}
