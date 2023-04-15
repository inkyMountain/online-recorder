import { useMemoizedFn } from "ahooks"
import { Button } from "antd/es"
import { useNavigate } from "react-router-dom"

export const Component = () => {
  const navigate = useNavigate()
  const onGotoRecordClick = useMemoizedFn(() => {
    navigate("/recorder")
  })

  return (
    <div>
      <div>这是我们的首页，到时候应该放一些使用介绍。</div>
      <Button onClick={onGotoRecordClick}>去录制</Button>
    </div>
  )
}
