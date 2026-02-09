import { render } from 'preact';
import Router, { Route } from 'preact-router';
import './index.css';

import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { RouteForm } from './pages/RouteForm';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';

function App() {
  return (
    <Layout>
      <Router>
        <Route path="/" component={Dashboard} />
        <Route path="/routes/new" component={RouteForm} />
        <Route path="/routes/:id" component={RouteForm} />
        <Route path="/settings" component={Settings} />
        <Route default component={NotFound} />
      </Router>
    </Layout>
  );
}

render(<App />, document.getElementById('app')!);
