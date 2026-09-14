import { lazy, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";

import { ProfileProvider } from "./context/ProfileContext.jsx";
import { TeamsProvider } from "./context/TeamsContext.jsx";
import { ChatUIProvider } from "./context/ChatUIContext.jsx";
import Layout from "./components/Layout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

// Code-splitting routes with React.lazy
const Landing = lazy(() => import("./pages/Landing.jsx"));
const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
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
const NotFound = lazy(() => import("./pages/NotFound.jsx"));

function RouteFallback() {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontFamily: "Inter, sans-serif",
          fontSize: "13px",
          color: "var(--muted, #c7c8ca)",
        }}
      >
        <span className="ai-spinner" />
        <span>Loading...</span>
      </div>
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
                path="/about"
                element={
                  <ProtectedRoute>
                    <About />
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

              {/* Route Aliases */}
              <Route path="/coding-rooms" element={<Navigate to="/rooms" replace />} />
              <Route path="/dashboard" element={<Navigate to="/workspace" replace />} />
              <Route path="/edit-profile" element={<Navigate to="/profile/edit" replace />} />
            </Route>

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
