import { createContext, useEffect, useRef, useState } from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import * as Tone from "tone";
import * as d3 from "d3";
import DevTools from "./DevTools";

const router = createBrowserRouter([
  {
    path: "/",
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

function App() {
  return <div>try going to /dev you sillyhead</div>;
}

export default AppRouter;
