import { useEffect, useState } from 'react';
import { ChatArea } from './components/ChatArea';
import { Panel } from './components/Panel';

function App() {
  const [route, setRoute] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (route === '#/panel') {
    return (
      <div className="w-screen h-screen m-0 overflow-hidden bg-transparent p-2">
        <Panel />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen m-0 p-0 overflow-hidden font-sans bg-white">
      <ChatArea />
    </div>
  );
}

export default App;
