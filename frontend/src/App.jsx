import { lazy, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";

import { ProfileProvider } from "./context/ProfileContext.jsx";
import { TeamsProvider } from "./context/TeamsContext.jsx";
import { ChatUIProvider } from "./context/ChatUIContext.jsx";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

const Landing = lazy(() => import("./pages/Landing.jsx"));

// Code-splitting secondary routes with React.lazy
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const ResetPassword = lazy(() => import("./pages/ResetPassword.jsx"));
const GithubCallback = lazy(() => import("./pages/GithubCallback.jsx"));
const Hackathons = lazy(() => import("./pages/Hackathons.jsx"));
const Explore = lazy(() => import("./pages/Explore.jsx"));
const Profile = lazy(() => import("./pages/ProfilePage.jsx"));
const EditProfile = lazy(() => import("./pages/EditProfile.jsx"));
const Settings = lazy(() => import("./pages/Settings.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const Teams = lazy(() => import("./pages/Teams.jsx"));
const CreateTeam = lazy(() => import("./pages/CreateTeam.jsx"));
const TeamDetail = lazy(() => import("./pages/TeamDetail.jsx"));
const AI = lazy(() => import("./pages/AI.jsx"));
const CodingRooms = lazy(() => import("./pages/CodingRooms.jsx"));
const Onboarding = lazy(() => import("./pages/Onboarding.jsx"));
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

function RouteFallback() {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        zIndex: 999999,
        overflow: "hidden",
        background: "rgba(255, 255, 255, 0.05)",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(90deg, #ff98a2, #e17a92, #b39ad6)",
          animation: "routeProgress 1.2s ease-in-out infinite",
        }}
      />
      <style>{`
        @keyframes routeProgress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <ProfileProvider>
      <TeamsProvider>
        <ChatUIProvider>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route element={<Layout />}>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/about" element={<About />} />

              {/* Protected Routes */}
              <Route
                path="/hackathons"
                element={
                  <ProtectedRoute>
                    <Hackathons />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/explore"
                element={
                  <ProtectedRoute>
                    <Explore />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/edit"
                element={
                  <ProtectedRoute>
                    <EditProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/:username"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workspace"
                element={
                  <ProtectedRoute>
                    <Teams />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teams"
                element={
                  <ProtectedRoute>
                    <Teams />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teams/create"
                element={
                  <ProtectedRoute>
                    <CreateTeam />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teams/:id"
                element={
                  <ProtectedRoute>
                    <TeamDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ai"
                element={
                  <ProtectedRoute>
                    <AI />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rooms"
                element={
                  <ProtectedRoute>
                    <CodingRooms />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute allowIncomplete={true}>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />

              {/* Route Aliases */}
              <Route path="/complete-profile" element={<Navigate to="/onboarding" replace />} />
              <Route path="/coding-rooms" element={<Navigate to="/rooms" replace />} />
              <Route path="/dashboard" element={<Navigate to="/workspace" replace />} />
              <Route path="/edit-profile" element={<Navigate to="/profile/edit" replace />} />
            </Route>

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/auth/github/callback" element={<GithubCallback />} />

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        </ChatUIProvider>
      </TeamsProvider>
    </ProfileProvider>
  );
}
