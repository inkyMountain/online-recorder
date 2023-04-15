import Layout from "@/Layout"
import type { RouteObject } from "react-router-dom"

export const routes: Array<RouteObject> = [
  {
    element: <Layout />,
    path: "/",
    children: [
      {
        // /recorder 路径会匹配这个配置
        // lazy 属性代表需要懒加载。只有用户访问这个路由了，才会去下载这个路由对应的 js 代码。
        lazy: () => import("@/views/recorder/Recorder"),
        path: "recorder",
      },

      {
        // /home 路径会匹配这个配置
        lazy: () => import("@/views/home/Home"),
        path: "home",
      },

      // * 星号代表匹配所有的路由。如果用户输入了一个乱七八糟的路径，就会显示这个。
      // 因为上面定义的所有路由，都不匹配了。
      {
        lazy: () => import("@/views/404/404"),
        path: "*",
      },
    ],
  },
]
