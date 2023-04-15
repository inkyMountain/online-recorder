import ReactDOM from "react-dom/client"
import App from "./App"
import { RouterProvider, createBrowserRouter } from "react-router-dom"
import { routes } from "./router/routes"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />,
)
