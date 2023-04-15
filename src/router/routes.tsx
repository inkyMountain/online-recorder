import Layout from "@/Layout"
import type { RouteObject } from "react-router-dom"

export const routes: Array<RouteObject> = [
  {
    element: <Layout />,
    path: "/",
    children: [
      {
        lazy: () => import("@/views/recorder/Recorder"),
        path: "recorder",
      },
      {
        lazy: () => import("@/views/home/Home"),
        path: "home",
      },

      // * 星号代表匹配所有的路由。如果用户输入了一个乱七八糟的路径，就会显示这个。
      {
        lazy: () => import("@/views/404/404"),
        path: "*",
      },
    ],
  },
]
