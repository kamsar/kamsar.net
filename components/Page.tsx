import React, { FunctionComponent } from "react";
import Meta from "./Meta";
import Header from "./Header";

import '../public/styles.css';

const Page: FunctionComponent = props => {
  return (
    <div>
      <Meta />
      <Header />
      {props.children}
    </div>
  );
};

export default Page;
