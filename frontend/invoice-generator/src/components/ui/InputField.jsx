import React from 'react'

const InputField = ({icon: Icon, label, name, id, ...props}) => {
  // The DOM id defaults to `name`, but callers that render the same `name`
  // twice on one page (Bill From and Bill To both have an "email" field) must
  // pass a distinct `id`. Otherwise both labels carry the same `for`, the
  // browser resolves it to the first match, and clicking "Client Email" moves
  // focus to the Bill From email input.
  const fieldId = id || name;

  return (
    <div>
    {label && <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700 mb-2">{label}</label>}
    <div className="relative">
      {Icon && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="w-5 h-5 text-slate-400" />
      </div>}
      <input
        id={fieldId}
        name={name}
        {...props}
        className={`w-full h-10 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${Icon ? 'pl-10' : 'pl-3'}`}
      />
    </div>
  </div>
  )
}

export default InputField
