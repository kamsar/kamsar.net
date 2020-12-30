import React, { FunctionComponent } from "react";
import Meta from "./Meta";
import Header from "./Header";

import '../public/styles.css';

const Page: FunctionComponent = props => {
  return (
    <div>
      <Meta />
      <Header />
      <main role="content">
        {props.children}
      </main>

      <style jsx>{`
        main {
          margin: 5px;
        }
      `}</style>
    </div>
  );
};

export default Page;
