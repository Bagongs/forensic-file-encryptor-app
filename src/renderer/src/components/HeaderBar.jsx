import headerImg from '../assets/images/header-full.png'

export default function HeaderBar() {
  return (
    <div
      className="w-full h-20 bg-no-repeat bg-left"
      style={{
        backgroundImage: `url(${headerImg})`,
        backgroundSize: 'cover'
      }}
    ></div>
  )
}
