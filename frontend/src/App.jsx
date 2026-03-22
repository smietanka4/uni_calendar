import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Navbar from './components/Navbar'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import WeekPage from './pages/WeekPage'
import AllCoursesPage from './pages/AllCoursesPage'
import AddCoursePage from './pages/AddCoursePage'
import EditCoursePage from './pages/EditCoursePage'
import CalendarsPage from './pages/CalendarsPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/zapomnialem-hasla" element={<ForgotPasswordPage />} />
          <Route path="/reset-hasla/:uid/:token" element={<ResetPasswordPage />} />

          {/* Protected */}
          <Route element={<PrivateRoute />}>
            <Route path="/" element={<WeekPage />} />
            <Route path="/wszystkie" element={<AllCoursesPage />} />
            <Route path="/grupy" element={<CalendarsPage />} />
            <Route path="/dodaj" element={<AddCoursePage />} />
            <Route path="/edytuj/:id" element={<EditCoursePage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
