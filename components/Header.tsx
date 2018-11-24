import Router from "next/router";
import NProgress from "nprogress";
import Logo from "./Logo";

import "nprogress/nprogress.css";

Router.onRouteChangeStart = () => {
  NProgress.start();
};

Router.onRouteChangeComplete = () => {
  NProgress.done();
};

Router.onRouteChangeError = () => {
  NProgress.done();
};

const Header = () => <Logo />;

export default Header;
