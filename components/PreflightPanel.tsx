import React from 'react';
import { PreflightValidationResult, ValidationIssue } from '../types';

interface PreflightPanelProps {
  result: PreflightValidationResult | null;
  onDismiss?: () => void;
}

const IssueList: React.FC<{ title: string; color: string; issues: ValidationIssue[] }> = ({ title, color, issues }) => {
  if (issues.length === 0) {
    return null;
  }

  return (
    <div className={`border ${color} rounded-lg p-4 bg-slate-900/60`}> 
      <h3 className="text-sm font-semibold mb-3 text-slate-100">{title}</h3>
      <ul className="space-y-2 text-sm text-slate-200">
        {issues.map((issue, index) => (
          <li key={index} className="leading-snug">
            <span>{issue.message}</span>
            {issue.path && (
              <span className="block text-xs text-slate-400 mt-1 font-mono">{issue.path}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const PreflightPanel: React.FC<PreflightPanelProps> = ({ result, onDismiss }) => {
  if (!result || (!result.hasErrors && !result.hasWarnings)) {
    return null;
  }

  return (
    <div className="bg-slate-900/40 border border-slate-700 rounded-xl p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-200 font-semibold text-sm">Preflight Validation</p>
          <p className="text-xs text-slate-400">
            {result.hasErrors
              ? 'Resolve the errors below before syncing to Chainlit.'
              : 'No blocking errors detected. Review warnings for best results.'}
          </p>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-200 transition"
            aria-label="Dismiss preflight validation results"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <IssueList
        title={`${result.errors.length} error${result.errors.length === 1 ? '' : 's'} found`}
        color="border-red-500/50"
        issues={result.errors}
      />

      <IssueList
        title={`${result.warnings.length} warning${result.warnings.length === 1 ? '' : 's'} found`}
        color="border-amber-500/50"
        issues={result.warnings}
      />
    </div>
  );
};
