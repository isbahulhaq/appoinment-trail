
import React, { ErrorInfo, ReactNode, Component } from 'react';

interface Props {
  // Children is made optional to resolve "missing in type '{}'" errors when used as a wrapper
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Fix: Explicitly extending Component<Props, State> and declaring state as a public property
// to ensure TypeScript correctly identifies 'state' and 'props' members.
class ErrorBoundary extends Component<Props, State> {
  // Fix: Explicitly defining state property to resolve "Property 'state' does not exist" errors
  public state: State = {
    hasError: false
  };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("MedQueue Uncaught Error:", error, errorInfo);
  }

  private handleReset = () => {
    // Synchronizing the storage key with the constant in useQueue.tsx ('medqueue_appointments_v1')
    localStorage.removeItem('medqueue_appointments_v1');
    window.location.reload();
  };

  public render(): ReactNode {
    // Fix: Accessing this.state and this.props now works correctly as the class properly inherits from Component
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border-2 border-red-50">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter mb-2">System Interruption</h1>
            <p className="text-slate-500 font-medium mb-8">
              A critical clinical process failed to execute. This may be due to a synchronization error or corrupted local data.
            </p>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition"
              >
                Attempt Hot Reload
              </button>
              <button 
                onClick={this.handleReset}
                className="w-full bg-white border-2 border-slate-100 text-slate-400 py-4 rounded-2xl font-black hover:text-red-600 hover:border-red-100 transition text-sm"
              >
                Reset Local Database & Clear Cache
              </button>
            </div>
            <p className="mt-6 text-[10px] text-slate-300 font-bold uppercase tracking-widest">
              Error: {this.state.error?.message || "Unknown Runtime Exception"}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
