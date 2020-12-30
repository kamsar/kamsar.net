const Logo = () => (
  <div className="logo">
    <h1>Kam Figy</h1>
    <h2>JS, C#, Sitecore, and Sarcasm</h2>

    <style jsx>{`
      .logo {
        position: relative;
      }

      h1 {
        background: var(--primary);
        color: var(--tertiary);
        display: inline-block;
        margin: 0;
        font-size: 4rem;
        padding: 15px 20px;
        text-transform: uppercase;
        transform: skew(-7deg);
        white-space: nowrap;
      }

      h2 {
        color: var(--tertiary);
        right: 20px;
        font-family: Lato, sans-serif;
        font-size: 1rem;
        padding: 5px;
        position: absolute;
        transform: skew(-7deg);
        bottom: 5px;
      }
    `}</style>
  </div>
);

export default Logo;
