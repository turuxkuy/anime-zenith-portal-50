
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// We're just creating a minimal App to fix the build errors
// The actual application is using HTML pages
const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<div>Redirecting to index.html...</div>} />
      </Routes>
    </Router>
  );
};

export default App;
