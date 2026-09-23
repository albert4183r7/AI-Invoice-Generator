import React from "react";

const TextareaField = ({ icon: Icon, label, name, id, ...props }) => {
  // See InputField: an explicit `id` keeps the label pointing at the right
  // control when the same `name` appears more than once on a page.
  const fieldId = id || name;

  return (
    <div>
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute top-3 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="w-5 h-5 text-slate-400" />
          </div>
        )}
        <textarea
          id={fieldId}
          name={name}
          rows={3}
          {...props}
          className={`w-full min-h-[100px] pr-3 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            Icon ? "pl-10" : "pl-3"
          }`}
        ></textarea>
      </div>
    </div>
  );
};

export default TextareaField;
