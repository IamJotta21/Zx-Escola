import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
}) => {
  const range = (start: number, end: number) => {
    const length = end - start + 1;
    return Array.from({ length }, (_, idx) => idx + start);
  };

  const fetchPageNumbers = () => {
    const totalNumbers = siblingCount * 2 + 3; // first + last + current + siblings
    const totalBlocks = totalNumbers + 2; // totalNumbers + 2 ellipses

    if (totalPages > totalBlocks) {
      const startPage = Math.max(2, currentPage - siblingCount);
      const endPage = Math.min(totalPages - 1, currentPage + siblingCount);

      let pages: (number | string)[] = range(startPage, endPage);

      const hasLeftSpill = startPage > 2;
      const hasRightSpill = totalPages - endPage > 1;
      const spillOffset = totalNumbers - (pages.length + 1);

      switch (true) {
        // case 1: spill on right only
        case hasLeftSpill && !hasRightSpill: {
          const extraPages = range(startPage - spillOffset, startPage - 1);
          pages = ['...', ...extraPages, ...pages];
          break;
        }
        // case 2: spill on left only
        case !hasLeftSpill && hasRightSpill: {
          const extraPages = range(endPage + 1, endPage + spillOffset);
          pages = [...pages, ...extraPages, '...'];
          break;
        }
        // case 3: spills on both sides
        case hasLeftSpill && hasRightSpill:
        default: {
          pages = ['...', ...pages, '...'];
          break;
        }
      }

      return [1, ...pages, totalPages];
    }

    return range(1, totalPages);
  };

  const pages = fetchPageNumbers();

  if (totalPages <= 1) return null;

  return (
    <nav className="flex items-center justify-between px-2 py-4" aria-label="Navegação de página">
      <div className="flex flex-1 justify-between sm:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          leftIcon={<ChevronLeft className="h-4 w-4" />}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          rightIcon={<ChevronRight className="h-4 w-4" />}
        >
          Próximo
        </Button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-sans">
            Página <span className="font-semibold text-foreground">{currentPage}</span> de{' '}
            <span className="font-semibold text-foreground">{totalPages}</span>
          </p>
        </div>
        <div>
          <ul className="inline-flex -space-x-px rounded-md gap-1">
            <li>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </li>

            {pages.map((page, index) => {
              if (page === '...') {
                return (
                  <li key={`ellipsis-${index}`}>
                    <span className="inline-flex h-8 w-8 items-center justify-center text-sm text-muted-foreground select-none">
                      ...
                    </span>
                  </li>
                );
              }

              const isCurrent = page === currentPage;

              return (
                <li key={`page-${page}`}>
                  <Button
                    variant={isCurrent ? 'primary' : 'outline'}
                    size="sm"
                    className="h-8 w-8 p-0 text-xs font-semibold"
                    onClick={() => onPageChange(page as number)}
                    aria-label={`Ir para página ${page}`}
                    aria-current={isCurrent ? 'page' : undefined}
                  >
                    {page}
                  </Button>
                </li>
              );
            })}

            <li>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                aria-label="Próxima página"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};
