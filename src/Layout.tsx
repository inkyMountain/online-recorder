import { useOutlet } from "react-router-dom"

const Layout = () => {
  // outlet 是 react router 根据路由匹配后，渲染的路由组件。
  const outlet = useOutlet()
  return <>{outlet}</>
}

export default Layout
