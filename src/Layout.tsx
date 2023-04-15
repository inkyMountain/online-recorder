import { useOutlet } from "react-router-dom"

const Layout = () => {
  const outlet = useOutlet()
  return <>{outlet}</>
}

export default Layout
