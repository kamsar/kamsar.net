import { FunctionComponent } from "react";

const Nav: FunctionComponent = () => (
  <nav>
    <ul>
      <li><a>Home</a></li>
      <li><a>Archives</a></li>
      <li><a>About</a></li>
    </ul>

    <style jsx>{`
      ul {
        align-items: center;
        display: flex;
        justify-content: space-between;
        margin-left: 20px;
      }

      li {
        list-style-type: none;
        padding: 1rem;
        position: relative;
        vertical-align: middle;
      }

      a:before {
        content: '';
        width: 2px;
        left: 0;
        background: gray;
        height: 100%;
        position: absolute;
        transform: skew(-20deg);
        top: 0;
        bottom: 0;
      }
    `}</style>
  </nav>
);

export default Nav;
