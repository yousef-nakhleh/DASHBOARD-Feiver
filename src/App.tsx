// src/App.tsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

// Layout & Pages
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Agenda from "./pages/Agenda";
import CashRegister from "./pages/CashRegister";
import Contacts from "./pages/Contacts";
import Trattamenti from "./pages/Trattamenti";
import Analytics from "./pages/Analytics";
import Magazzino from "./pages/Magazzino";
import StaffAvailability from "./pages/StaffAvailability";
import PaymentPage from "./components/payment/PaymentPage";
import Chatbot from "./pages/Chatbot";
import WaitingList from "./pages/WaitingList";
import Vapi from "./pages/Vapi";
import ClosingExceptions from "./pages/ClosingExceptions";
import OpeningExceptions from "./pages/OpeningExceptions";
import Reports from "./pages/Reports";

// 🔐 Auth
import { AuthProvider } from "./components/auth/AuthContext";
import LoginPage from "./components/auth/LoginPage";
import RequireAuth from "./components/auth/RequireAuth";
import AuthCallback from "./components/auth/AuthCallback";
import CompleteAccount from "./components/auth/CompleteAccount";
import AuthError from "./components/auth/AuthError";
import PendingAccess from "./components/auth/PendingAccess";
import MembershipGuard from "./components/auth/MembershipGuard";

// ✅ Business selection
import { SelectedBusinessProvider } from "./components/auth/SelectedBusinessProvider";
import BusinessSelector from "./components/auth/BusinessSelector";

// ✅ Features
import { FeaturesProvider } from "./features/FeaturesProvider";
import { AgendaGate } from "./gates/AgendaGate";
import { ChatbotGate } from "./gates/ChatbotGate";
import { TransactionsGate } from "./gates/TransactionsGate";
import { AvailabilityGate } from "./gates/AvailabilityGate";
import { ContactsGate } from "./gates/ContactsGate";
import { ServicesGate } from "./gates/ServicesGate";
import { PhoneCallerGate } from "./gates/PhoneCallerGate";
import { WaitingListGate } from "./gates/WaitingListGate";
import { OpeningExceptionsGate } from "./gates/OpeningExceptionsGate";
import { ClosingExceptionsGate } from "./gates/ClosingExceptionsGate";
import { ReportsGate } from "./gates/ReportsGate";

// ---------- App ----------
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ---------- Public routes ---------- */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/complete-account" element={<CompleteAccount />} />
          <Route path="/auth/error" element={<AuthError />} />
          <Route path="/pending-access" element={<PendingAccess />} />

          {/* ---------- Protected routes ---------- */}
          <Route element={<RequireAuth />}>
            <Route element={<MembershipGuard />}>
              <Route
                element={
                  <SelectedBusinessProvider>
                    <Outlet />
                  </SelectedBusinessProvider>
                }
              >
                <Route
                  element={
                    <WithFeaturesWrapper>
                      <Outlet />
                    </WithFeaturesWrapper>
                  }
                >
                  <Route
                    path="/"
                    element={
                      <>
                        <BusinessSelector />
                        <Layout />
                      </>
                    }
                  >
                    <Route index element={<Dashboard />} />

                    {/* Gated routes */}
                    <Route
                      path="agenda"
                      element={
                        <AgendaGate fallback={<Navigate to="/" replace />}>
                          <Agenda />
                        </AgendaGate>
                      }
                    />
                    <Route
                      path="cassa"
                      element={
                        <TransactionsGate fallback={<Navigate to="/" replace />}>
                          <CashRegister />
                        </TransactionsGate>
                      }
                    />
                    <Route path="cassa/pagamento" element={<PaymentPage />} />
                    <Route
                      path="rubrica"
                      element={
                        <ContactsGate fallback={<Navigate to="/" replace />}>
                          <Contacts />
                        </ContactsGate>
                      }
                    />
                    <Route
                      path="trattamenti"
                      element={
                        <ServicesGate fallback={<Navigate to="/" replace />}>
                          <Trattamenti />
                        </ServicesGate>
                      }
                    />
                    <Route path="analytics" element={<Analytics />} />
                    <Route path="magazzino" element={<Magazzino />} />
                    <Route
                      path="staff"
                      element={
                        <AvailabilityGate fallback={<Navigate to="/" replace />}>
                          <StaffAvailability />
                        </AvailabilityGate>
                      }
                    />
                    <Route
                      path="chatbot"
                      element={
                        <ChatbotGate fallback={<Navigate to="/" replace />}>
                          <Chatbot />
                        </ChatbotGate>
                      }
                    />
                    <Route
                      path="waiting-list"
                      element={
                        <WaitingListGate fallback={<Navigate to="/" replace />}>
                          <WaitingList />
                        </WaitingListGate>
                      }
                    />
                    <Route
                      path="vapi"
                      element={
                        <PhoneCallerGate fallback={<Navigate to="/" replace />}>
                          <Vapi />
                        </PhoneCallerGate>
                      }
                    />
                    <Route
                      path="aperture-eccezionali"
                      element={
                        <OpeningExceptionsGate
                          fallback={<Navigate to="/" replace />}
                        >
                          <OpeningExceptions />
                        </OpeningExceptionsGate>
                      }
                    />
                    <Route
                      path="exceptions"
                      element={
                        <ClosingExceptionsGate
                          fallback={<Navigate to="/" replace />}
                        >
                          <ClosingExceptions />
                        </ClosingExceptionsGate>
                      }
                    />
                    <Route
                      path="reports"
                      element={
                        <ReportsGate fallback={<Navigate to="/" replace />}>
                          <Reports />
                        </ReportsGate>
                      }
                    />

                    {/* Default */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Route>
              </Route>
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// Small wrapper to pass business_id into FeaturesProvider
function WithFeaturesWrapper({ children }: { children: React.ReactNode }) {
  return (
    <FeaturesProvider businessId={"from context via SelectedBusinessProvider"}>
      {children}
    </FeaturesProvider>
  );
}

export default App;