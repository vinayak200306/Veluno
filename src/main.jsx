import React from 'react'
import ReactDOM from 'react-dom/client'
import VelunoStore from './VelunoStore.jsx'
import AdminDashboard from './components/AdminDashboard.jsx'

// Simple helper to check if we are in admin mode
const isAdmin = new URLSearchParams(window.location.search).get('admin') === 'true';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        {isAdmin ? <AdminDashboard /> : <VelunoStore />}
    </React.StrictMode>,
)
