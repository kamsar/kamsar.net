import Link from "next/link";

import SUMMARY from "../content/summary.json";

const Home = () => (
  <React.Fragment>
    <h1>OHAI post listes</h1>
    <ul>
      {Object.keys(SUMMARY.routes).map(route => (
        <li key={route}>
          <Link href={route}>
            <a>{SUMMARY.routes[route].title}</a>
          </Link>
        </li>
      ))}
    </ul>
  </React.Fragment>
);

export default Home;
