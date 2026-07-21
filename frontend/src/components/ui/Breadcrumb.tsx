import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        <li className="inline-flex items-center">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors gap-1 font-sans"
          >
            <Home className="h-3 w-3" />
            <span>Início</span>
          </Link>
        </li>

        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;

          return (
            <li key={idx} className="flex items-center">
              <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0 mx-1 md:mx-2" />

              {isLast ? (
                <span className="inline-flex items-center text-xs font-bold text-foreground font-sans select-none">
                  {item.icon && <span className="mr-1.5 shrink-0">{item.icon}</span>}
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  to={item.href}
                  className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors font-sans"
                >
                  {item.icon && <span className="mr-1.5 shrink-0">{item.icon}</span>}
                  {item.label}
                </Link>
              ) : (
                <span className="inline-flex items-center text-xs font-semibold text-muted-foreground font-sans">
                  {item.icon && <span className="mr-1.5 shrink-0">{item.icon}</span>}
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

Breadcrumb.displayName = 'Breadcrumb';
export default Breadcrumb;
