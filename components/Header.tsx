import Router from "next/router";
import NProgress from "nprogress";
import Logo from "./Logo";

import "nprogress/nprogress.css";
import Nav from "./Nav";

Router.onRouteChangeStart = () => {
  NProgress.start();
};

Router.onRouteChangeComplete = () => {
  NProgress.done();
};

Router.onRouteChangeError = () => {
  NProgress.done();
};

const Header = () => (
  <header>
    <Logo />
    <Nav />
    <form>
      <input type="text" placeholder="Search (todo)" />
    </form>
    <style jsx>{`
      header {
        display: flex;
        border-bottom: 10px solid gray;
      }
    `}</style>
  </header>
);

export default Header;
