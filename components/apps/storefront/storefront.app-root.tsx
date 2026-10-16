import { BrowserRouter } from 'react-router-dom';
import {
  createRoot,
  // hydrateRoot
} from 'react-dom/client';
import { Storefront } from "./storefront.js";
import "./storefront.module.css";

/**
 * comment this in for server-side rendering (ssr) and comment 
 * out of the root.render() invocation below.
*/
// hydrateRoot(
//   document.getElementById("root") as HTMLElement,
//   <BrowserRouter>
//     <Storefront />
//   </BrowserRouter>
// );

if (import.meta.hot) {
  import.meta.hot.accept();
}
  
/**
 * mounting for client side rendering.
 */
const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <BrowserRouter>
    <Storefront />
  </BrowserRouter>
);