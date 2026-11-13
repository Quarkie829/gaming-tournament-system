import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public & Player Pages
import { HomePage } from './pages/HomePage';
import { TournamentsPage } from './pages/TournamentsPage';
import { TournamentDetailsPage } from './pages/TournamentDetailsPage';
import { MatchesPage } from './pages/MatchesPage';
import { MatchDetailsPage } from './pages/MatchDetailsPage';
import { TeamsPage } from './pages/TeamsPage';
import { TeamDetailsPage } from './pages/TeamDetailsPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminTournamentsPage } from './pages/admin/AdminTournamentsPage';
import { AdminGamesPage } from './pages/admin/AdminGamesPage';
import { AdminRegistrationsPage } from './pages/admin/AdminRegistrationsPage';
import { AdminMatchesPage } from './pages/admin/AdminMatchesPage';
import { AdminDisputesPage } from './pages/admin/AdminDisputesPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';
import { AdminPrizesPage } from './pages/admin/AdminPrizesPage';
import { AdminSponsorsPage } from './pages/admin/AdminSponsorsPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="flex flex-col min-h-screen bg-[#0a0e17] text-slate-100">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public & Player Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/tournaments" element={<TournamentsPage />} />
              <Route path="/tournaments/:id" element={<TournamentDetailsPage />} />
              <Route path="/matches" element={<MatchesPage />} />
              <Route path="/matches/:id" element={<MatchDetailsPage />} />
              <Route path="/teams" element={<TeamsPage />} />
              <Route path="/teams/:id" element={<TeamDetailsPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Player Route */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tournaments"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminTournamentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/games"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminGamesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/registrations"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminRegistrationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/matches"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminMatchesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/disputes"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminDisputesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/payments"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminPaymentsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/prizes"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminPrizesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/sponsors"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminSponsorsPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
