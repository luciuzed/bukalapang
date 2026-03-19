import React from 'react'
import loadingSvg from '../assets/loading.svg'

const LoadingOverlay = ({ show }) => {
  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto" style={{ backgroundColor: 'rgba(0, 0, 0, 0.47)' }}>
      <img src={loadingSvg} alt="Loading" className="h-30 w-30 animate-spin" />
    </div>
  )
}

export default LoadingOverlay
