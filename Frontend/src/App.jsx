import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Watch from "./pages/Watch";
import Upload from "./pages/Upload";
import Channel from "./pages/Channel";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Liked from "./pages/Liked";
import Creator from "./pages/Creator";
import Subscriptions from "./pages/Subscriptions";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./services/auth";

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-[#09090b] text-white">
        <Navbar />
        <Sidebar />
        <main className="mx-auto min-h-[calc(100vh-64px)] max-w-[1800px] px-4 pb-24 pt-6 md:ml-20 md:px-8 md:pb-10 lg:ml-60">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/watch/:videoId" element={<Watch />} />
            <Route path="/c/:username" element={<Channel />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
            <Route path="/liked" element={<ProtectedRoute><Liked /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Creator /></ProtectedRoute>} />
            <Route path="/subscriptions" element={<ProtectedRoute><Subscriptions /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}
