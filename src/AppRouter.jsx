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
  return (
    <>
      <div
        style={{
          height: "100vh",
          width: "100vw",
        }}
        className="absolute overflow-hidden mix-blend-multiply"
      >
        {/* <img src="/wall.jpg" alt="" className="object-cover" /> */}
      </div>
      <RouterProvider router={router} />
    </>
  );
}

export default AppRouter;
