import { Component, ErrorInfo, ReactNode } from 'react';

import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-8 text-center">
          <div className="w-full max-w-md rounded-2xl border border-red-200 dark:border-red-950 bg-white dark:bg-slate-900 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mb-2">
              Ops! Algo deu errado.
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Ocorreu um erro inesperado ao renderizar esta página.
            </p>
            {this.state.error && (
              <div className="mb-6 rounded-lg bg-slate-50 dark:bg-slate-950 p-3 text-left font-mono text-xs text-red-600 dark:text-red-400 max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800">
                <strong>{this.state.error.toString()}</strong>
                {this.state.errorInfo && (
                  <pre className="mt-2 whitespace-pre-wrap opacity-80">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
            <div className="flex justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <RotateCcw className="h-4 w-4" /> Recarregar Sistema
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
export default ErrorBoundary;
