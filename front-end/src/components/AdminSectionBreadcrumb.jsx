import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FiHome } from 'react-icons/fi'

const AdminSectionBreadcrumb = ({ label, items = [] }) => {
  const navigate = useNavigate()
  const breadcrumbItems = Array.isArray(items) && items.length > 0
    ? items
        .map((item) => {
          if (typeof item === 'string') {
            const trimmed = item.trim()
            return trimmed ? { label: trimmed } : null
          }

          if (!item || typeof item !== 'object' || typeof item.label !== 'string') {
            return null
          }

          const trimmedLabel = item.label.trim()
          if (!trimmedLabel) return null

          return {
            label: trimmedLabel,
            path: typeof item.path === 'string' ? item.path : undefined,
            onClick: typeof item.onClick === 'function' ? item.onClick : undefined,
          }
        })
        .filter(Boolean)
    : (label ? [{ label }] : [])

  const handleItemClick = (item) => {
    if (item.onClick) {
      item.onClick()
      return
    }

    if (item.path) {
      navigate(item.path)
    }
  }

  return (
    <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
      <button
        type="button"
        onClick={() => navigate('/venue')}
        className="cursor-pointer hover:opacity-80 transition"
        aria-label="Go to venue"
      >
        <FiHome className="h-4 w-4" aria-hidden="true" />
      </button>
      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={`${item.label}-${index}`}>
          <span className="text-primary/60">&gt;</span>
          {(item.path || item.onClick) ? (
            <button
              type="button"
              onClick={() => handleItemClick(item)}
              className="cursor-pointer hover:opacity-80 transition"
            >
              {item.label}
            </button>
          ) : (
            <span>{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

export default AdminSectionBreadcrumb