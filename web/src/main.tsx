import { render } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { List } from './views/List';
import { Problem } from './views/Problem';
import { Settings } from './views/Settings';
import './style.css';

// Hash routing: GitHub Pages has no SPA fallback, and three screens don't need a router library.
function App() {
  const [hash, setHash] = useState(location.hash);
  useEffect(() => {
    const onChange = () => setHash(location.hash);
    addEventListener('hashchange', onChange);
    return () => removeEventListener('hashchange', onChange);
  }, []);

  const problem = hash.match(/^#\/p\/([\w-]+)/);
  if (problem) return <Problem key={problem[1]} slug={problem[1]} />;
  if (hash === '#/settings') return <Settings />;
  return <List />;
}

render(<App />, document.getElementById('app')!);
