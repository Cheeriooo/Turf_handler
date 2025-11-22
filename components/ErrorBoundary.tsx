import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white p-4">
                    <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-xl max-w-md w-full shadow-2xl">
                        <h2 className="text-xl font-bold text-red-400 mb-2">Something went wrong</h2>
                        <p className="text-sm text-gray-300 mb-4">The application encountered an unexpected error.</p>
                        <pre className="bg-black/50 p-3 rounded text-xs font-mono text-red-200 overflow-auto max-h-40 mb-4 border border-white/5">
                            {this.state.error?.message}
                        </pre>
                        <button
                            onClick={() => {
                                localStorage.removeItem('cricketResolverState'); // Clear state to prevent loop
                                window.location.reload();
                            }}
                            className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-lg font-bold transition-colors shadow-lg shadow-red-900/20"
                        >
                            Clear State & Reload
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
