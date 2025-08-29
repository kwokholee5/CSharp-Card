import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Home } from './pages/Home';
import { Study } from './pages/Study';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/study" element={<Study />} />
          <Route path="/browse" element={<div>Browse Page (Coming Soon)</div>} />
          <Route path="/progress" element={<div>Progress Page (Coming Soon)</div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;