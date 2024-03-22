import { RouterProvider, createBrowserRouter } from "react-router-dom";
import DevTools from "./DevTools";
import App from "./App";
import GameMenu from "./GameMenu";

const router = createBrowserRouter([
  { path: "/", element: <GameMenu /> },
  {
    path: "/app/:game",
    element: <App />,
  },
  {
    path: "/dev",
    element: <DevTools />,
  },
]);

function AppRouter() {
  return <RouterProvider router={router} />;
}

export default AppRouter;
