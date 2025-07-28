import { Router as RouterProvider } from '@solidjs/router';
import Router from './route/Router';
import ToastContainer from './components/common/ToastContainer';

export default function App() {
  return (
    <>
    <RouterProvider>
      <Router />
    </RouterProvider>
    <ToastContainer />
    </>
  );
}
