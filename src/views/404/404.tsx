import { useNavigate } from "react-router-dom"
import { useMemoizedFn } from "ahooks"
import { Button } from "antd"

export const Component = () => {
  const navigate = useNavigate()
  const onBackHomeClick = useMemoizedFn(() => {
    navigate("/home")
  })

  return (
    <div>
      <div>没有这个路径哦~</div>
      <Button onClick={onBackHomeClick}>回首页</Button>
    </div>
  )
}
