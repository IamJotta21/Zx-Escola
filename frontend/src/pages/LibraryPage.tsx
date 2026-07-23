import React, { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Edit2,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/Table';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BookCategory {
  id: string;
  name: string;
  description?: string;
}
interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  year?: number;
  totalQty: number;
  availableQty: number;
  category?: BookCategory;
  description?: string;
}
interface BookLoan {
  id: string;
  borrowerName: string;
  loanDate: string;
  dueDate: string;
  returnDate?: string;
  status: string;
  fine: number;
  notes?: string;
  book: Book;
}
interface BookReservation {
  id: string;
  requesterName: string;
  reservedAt: string;
  status: string;
  book: Book;
}
interface Summary {
  totalBooks: number;
  activeLoans: number;
  overdueCount: number;
  pendingReservations: number;
  totalFinesCollected: number;
  overdueList: BookLoan[];
}

// ─── Component ─────────────────────────────────────────────────────────────────

export const LibraryPage: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'books' | 'loans' | 'reservations'>(
    'dashboard'
  );

  // Data
  const [summary, setSummary] = useState<Summary>({
    totalBooks: 0,
    activeLoans: 0,
    overdueCount: 0,
    pendingReservations: 0,
    totalFinesCollected: 0,
    overdueList: [],
  });
  const [categories, setCategories] = useState<BookCategory[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [loans, setLoans] = useState<BookLoan[]>([]);
  const [reservations, setReservations] = useState<BookReservation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loanStatusFilter, setLoanStatusFilter] = useState('');

  // Book form state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookForm, setBookForm] = useState({
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    year: '',
    categoryId: '',
    totalQty: '1',
    description: '',
  });
  const [savingBook, setSavingBook] = useState(false);

  // Loan form state
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [loanForm, setLoanForm] = useState({
    bookId: '',
    borrowerName: '',
    loanDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
  });
  const [creatingLoan, setCreatingLoan] = useState(false);

  // Return modal
  const [returningLoan, setReturningLoan] = useState<BookLoan | null>(null);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [processingReturn, setProcessingReturn] = useState(false);

  // Reservation form
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [resForm, setResForm] = useState({ bookId: '', requesterName: '' });
  const [savingReservation, setSavingReservation] = useState(false);

  // Category form
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [savingCat, setSavingCat] = useState(false);

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchSummary = useCallback(async () => {
    try {
      const r = await api.get('/library/summary');
      setSummary(r.data.data || null);
    } catch {
      /* silent */
    }
  }, []);
  const fetchCategories = useCallback(async () => {
    try {
      const r = await api.get('/library/categories');
      setCategories(r.data.data || []);
    } catch {
      /* silent */
    }
  }, []);
  const fetchBooks = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (searchTerm) params.search = searchTerm;
      const r = await api.get('/library/books', { params });
      setBooks(r.data.data || []);
    } catch {
      /* silent */
    }
  }, [searchTerm]);
  const fetchLoans = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      if (loanStatusFilter) params.status = loanStatusFilter;
      const r = await api.get('/library/loans', { params });
      setLoans(r.data.data || []);
    } catch {
      /* silent */
    }
  }, [loanStatusFilter]);
  const fetchReservations = useCallback(async () => {
    try {
      const r = await api.get('/library/reservations');
      setReservations(r.data.data || []);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    fetchCategories();
    fetchBooks();
    fetchLoans();
    fetchReservations();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Book CRUD ──────────────────────────────────────────────────────────────
  const openBookModal = (book?: Book) => {
    setEditingBook(book || null);
    setBookForm(
      book
        ? {
            title: book.title,
            author: book.author,
            isbn: book.isbn || '',
            publisher: book.publisher || '',
            year: book.year?.toString() || '',
            categoryId: book.category?.id || '',
            totalQty: book.totalQty.toString(),
            description: book.description || '',
          }
        : {
            title: '',
            author: '',
            isbn: '',
            publisher: '',
            year: '',
            categoryId: '',
            totalQty: '1',
            description: '',
          }
    );
    setIsBookModalOpen(true);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookForm.title || !bookForm.author) {
      addToast({ type: 'warning', message: 'Título e autor são obrigatórios.' });
      return;
    }

    if (bookForm.year) {
      const yearNum = parseInt(bookForm.year);
      const currentYear = new Date().getFullYear();
      if (isNaN(yearNum) || yearNum < 1 || yearNum > currentYear) {
        addToast({
          type: 'warning',
          message: `Ano de publicação inválido (deve ser entre 1 e ${currentYear}).`,
        });
        return;
      }
    }

    const qty = parseInt(bookForm.totalQty);
    if (isNaN(qty) || qty < 0) {
      addToast({
        type: 'warning',
        message: 'Quantidade total de livros deve ser maior ou igual a zero.',
      });
      return;
    }

    setSavingBook(true);
    try {
      if (editingBook) {
        await api.put(`/library/books/${editingBook.id}`, bookForm);
        addToast({ type: 'success', message: 'Livro atualizado.' });
      } else {
        await api.post('/library/books', bookForm);
        addToast({ type: 'success', message: 'Livro cadastrado.' });
      }
      setIsBookModalOpen(false);
      fetchBooks();
      fetchSummary();
    } catch {
      addToast({ type: 'error', message: 'Erro ao salvar livro.' });
    } finally {
      setSavingBook(false);
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (!confirm('Excluir este livro do acervo?')) return;
    try {
      await api.delete(`/library/books/${id}`);
      fetchBooks();
      fetchSummary();
      addToast({ type: 'success', message: 'Livro removido.' });
    } catch {
      addToast({ type: 'error', message: 'Erro ao remover livro.' });
    }
  };

  // ─── Category CRUD ──────────────────────────────────────────────────────────
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCat(true);
    try {
      await api.post('/library/categories', { name: catName, description: catDesc });
      fetchCategories();
      setIsCatModalOpen(false);
      setCatName('');
      setCatDesc('');
    } catch {
      addToast({ type: 'error', message: 'Erro ao criar categoria.' });
    } finally {
      setSavingCat(false);
    }
  };

  // ─── Loan Actions ───────────────────────────────────────────────────────────
  const handleCreateLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingLoan(true);
    try {
      await api.post('/library/loans', loanForm);
      addToast({ type: 'success', message: 'Empréstimo registrado.' });
      setIsLoanModalOpen(false);
      setLoanForm({
        bookId: '',
        borrowerName: '',
        loanDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        notes: '',
      });
      fetchLoans();
      fetchBooks();
      fetchSummary();
    } catch {
      addToast({ type: 'error', message: 'Erro ao registrar empréstimo.' });
    } finally {
      setCreatingLoan(false);
    }
  };

  const handleReturnBook = async () => {
    if (!returningLoan) return;
    setProcessingReturn(true);
    try {
      const r = await api.put(`/library/loans/${returningLoan.id}/return`, { returnDate });
      const fine = r.data.data.fine;
      addToast({
        type: 'success',
        title: 'Devolução Registrada',
        message:
          fine > 0 ? `Multa por atraso: R$ ${fine.toFixed(2)}` : 'Devolvido no prazo, sem multa.',
      });
      setReturningLoan(null);
      fetchLoans();
      fetchBooks();
      fetchSummary();
    } catch {
      addToast({ type: 'error', message: 'Erro ao registrar devolução.' });
    } finally {
      setProcessingReturn(false);
    }
  };

  // ─── Reservation Actions ────────────────────────────────────────────────────
  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingReservation(true);
    try {
      await api.post('/library/reservations', resForm);
      addToast({ type: 'success', message: 'Reserva criada.' });
      setIsReservationModalOpen(false);
      setResForm({ bookId: '', requesterName: '' });
      fetchReservations();
    } catch {
      addToast({ type: 'error', message: 'Erro ao criar reserva.' });
    } finally {
      setSavingReservation(false);
    }
  };

  const handleCancelReservation = async (id: string) => {
    try {
      await api.put(`/library/reservations/${id}`, { status: 'CANCELADA' });
      fetchReservations();
      addToast({ type: 'success', message: 'Reserva cancelada.' });
    } catch {
      addToast({ type: 'error', message: 'Erro ao cancelar reserva.' });
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'ATIVO') return <Badge variant="warning">Ativo</Badge>;
    if (status === 'DEVOLVIDO') return <Badge variant="success">Devolvido</Badge>;
    if (status === 'ATRASADO') return <Badge variant="destructive">Atrasado</Badge>;
    if (status === 'AGUARDANDO') return <Badge variant="outline">Aguardando</Badge>;
    if (status === 'DISPONIVEL') return <Badge variant="success">Disponível</Badge>;
    if (status === 'CANCELADA') return <Badge variant="destructive">Cancelada</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: <BookOpen className="h-4 w-4" /> },
    { key: 'books', label: 'Acervo', icon: <BookOpen className="h-4 w-4" /> },
    { key: 'loans', label: 'Empréstimos', icon: <Clock className="h-4 w-4" /> },
    { key: 'reservations', label: 'Reservas', icon: <CheckCircle2 className="h-4 w-4" /> },
  ] as const;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Biblioteca Escolar
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Acervo, empréstimos, devoluções, reservas e multas.
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'books' && (
            <>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setIsCatModalOpen(true)}
              >
                Categoria
              </Button>
              <Button
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => openBookModal()}
              >
                Novo Livro
              </Button>
            </>
          )}
          {activeTab === 'loans' && (
            <Button
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsLoanModalOpen(true)}
            >
              Novo Empréstimo
            </Button>
          )}
          {activeTab === 'reservations' && (
            <Button
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsReservationModalOpen(true)}
            >
              Nova Reserva
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === t.key ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Dashboard ───────────────────────────────────────────────────────────── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: 'TOTAL DE LIVROS',
                value: summary.totalBooks,
                color: 'border-l-primary bg-primary/5',
              },
              {
                label: 'EMPRÉSTIMOS ATIVOS',
                value: summary.activeLoans,
                color: 'border-l-amber-500 bg-amber-500/5',
              },
              {
                label: 'EM ATRASO',
                value: summary.overdueCount,
                color: 'border-l-rose-500 bg-rose-500/5',
              },
              {
                label: 'RESERVAS PENDENTES',
                value: summary.pendingReservations,
                color: 'border-l-emerald-500 bg-emerald-500/5',
              },
            ].map((c) => (
              <Card key={c.label} className={`stripe-card border-l-4 ${c.color}`}>
                <CardContent className="p-4 space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground">{c.label}</div>
                  <div className="text-2xl font-extrabold text-foreground">{c.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {summary.overdueList.length > 0 && (
            <Card className="stripe-card">
              <CardContent className="p-6">
                <h2 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-500" /> Empréstimos em Atraso
                </h2>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Livro</TableHead>
                      <TableHead>Leitor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Dias Atraso</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.overdueList.map((l) => {
                      const diff = Math.ceil(
                        (new Date().getTime() - new Date(l.dueDate).getTime()) / 86400000
                      );
                      return (
                        <TableRow key={l.id}>
                          <TableCell className="font-semibold text-foreground">
                            {l.book.title}
                          </TableCell>
                          <TableCell>{l.borrowerName}</TableCell>
                          <TableCell className="font-mono text-xs text-rose-600">
                            {l.dueDate}
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">{diff} dias</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Books Tab ───────────────────────────────────────────────────────────── */}
      {activeTab === 'books' && (
        <Card className="stripe-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar título, autor, ISBN..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button variant="outline" size="sm" onClick={fetchBooks}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>ISBN</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Disponível / Total</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground text-xs py-10"
                    >
                      Nenhum livro cadastrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  books.map((b) => (
                    <TableRow key={b.id} className="group">
                      <TableCell className="font-semibold text-foreground">{b.title}</TableCell>
                      <TableCell className="text-xs">{b.author}</TableCell>
                      <TableCell className="text-xs font-mono">{b.isbn || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{b.category?.name || '—'}</Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            b.availableQty === 0
                              ? 'text-rose-600 font-bold text-xs'
                              : 'text-emerald-600 font-bold text-xs'
                          }
                        >
                          {b.availableQty}
                        </span>
                        <span className="text-xs text-muted-foreground"> / {b.totalQty}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => openBookModal(b)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive"
                            onClick={() => handleDeleteBook(b.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── Loans Tab ───────────────────────────────────────────────────────────── */}
      {activeTab === 'loans' && (
        <Card className="stripe-card">
          <CardContent className="p-6 space-y-4">
            <Select
              label="Filtrar por status"
              options={[
                { value: '', label: 'Todos' },
                { value: 'ATIVO', label: 'Ativo' },
                { value: 'DEVOLVIDO', label: 'Devolvido' },
                { value: 'ATRASADO', label: 'Atrasado' },
              ]}
              value={loanStatusFilter}
              onChange={(e) => setLoanStatusFilter(e.target.value)}
            />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Livro</TableHead>
                  <TableHead>Leitor</TableHead>
                  <TableHead>Empréstimo</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Devolução</TableHead>
                  <TableHead>Multa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground text-xs py-10"
                    >
                      Nenhum empréstimo encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  loans.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="font-semibold text-foreground text-xs">
                        {l.book.title}
                      </TableCell>
                      <TableCell className="text-xs">{l.borrowerName}</TableCell>
                      <TableCell className="font-mono text-xs">{l.loanDate}</TableCell>
                      <TableCell className="font-mono text-xs">{l.dueDate}</TableCell>
                      <TableCell className="font-mono text-xs">{l.returnDate || '—'}</TableCell>
                      <TableCell
                        className={l.fine > 0 ? 'text-rose-600 font-bold text-xs' : 'text-xs'}
                      >
                        {l.fine > 0 ? `R$ ${l.fine.toFixed(2)}` : '—'}
                      </TableCell>
                      <TableCell>{statusBadge(l.status)}</TableCell>
                      <TableCell className="text-right">
                        {l.status === 'ATIVO' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs text-primary border-primary/20"
                            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                            onClick={() => {
                              setReturningLoan(l);
                              setReturnDate(new Date().toISOString().split('T')[0]);
                            }}
                          >
                            Devolver
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── Reservations Tab ────────────────────────────────────────────────────── */}
      {activeTab === 'reservations' && (
        <Card className="stripe-card">
          <CardContent className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Livro</TableHead>
                  <TableHead>Solicitante</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground text-xs py-10"
                    >
                      Nenhuma reserva.
                    </TableCell>
                  </TableRow>
                ) : (
                  reservations.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-semibold text-foreground text-xs">
                        {r.book.title}
                      </TableCell>
                      <TableCell className="text-xs">{r.requesterName}</TableCell>
                      <TableCell className="font-mono text-xs">{r.reservedAt}</TableCell>
                      <TableCell>{statusBadge(r.status)}</TableCell>
                      <TableCell className="text-right">
                        {r.status === 'AGUARDANDO' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 text-xs text-destructive"
                            onClick={() => handleCancelReservation(r.id)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── Modals ────────────────────────────────────────────────────────────────── */}

      {/* Book Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title={editingBook ? 'Editar Livro' : 'Cadastrar Livro'}
        size="md"
      >
        <form onSubmit={handleSaveBook} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <Input
              label="Título *"
              value={bookForm.title}
              onChange={(e) => setBookForm((f) => ({ ...f, title: e.target.value }))}
              required
            />
            <Input
              label="Autor *"
              value={bookForm.author}
              onChange={(e) => setBookForm((f) => ({ ...f, author: e.target.value }))}
              required
            />
            <Input
              label="ISBN"
              value={bookForm.isbn}
              onChange={(e) => setBookForm((f) => ({ ...f, isbn: e.target.value }))}
            />
            <Input
              label="Editora"
              value={bookForm.publisher}
              onChange={(e) => setBookForm((f) => ({ ...f, publisher: e.target.value }))}
            />
            <Input
              label="Ano"
              type="number"
              value={bookForm.year}
              onChange={(e) => setBookForm((f) => ({ ...f, year: e.target.value }))}
            />
            <Input
              label="Quantidade"
              type="number"
              value={bookForm.totalQty}
              onChange={(e) => setBookForm((f) => ({ ...f, totalQty: e.target.value }))}
            />
            <Select
              label="Categoria"
              options={[
                { value: '', label: 'Sem categoria' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
              value={bookForm.categoryId}
              onChange={(e) => setBookForm((f) => ({ ...f, categoryId: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">Descrição</label>
            <textarea
              value={bookForm.description}
              onChange={(e) => setBookForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsBookModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={savingBook}>
              Salvar Livro
            </Button>
          </div>
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title="Nova Categoria"
        size="sm"
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <Input
            label="Nome da Categoria *"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            required
          />
          <Input label="Descrição" value={catDesc} onChange={(e) => setCatDesc(e.target.value)} />
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsCatModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={savingCat}>
              Criar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Loan Modal */}
      <Modal
        isOpen={isLoanModalOpen}
        onClose={() => setIsLoanModalOpen(false)}
        title="Registrar Empréstimo"
        size="sm"
      >
        <form onSubmit={handleCreateLoan} className="space-y-4">
          <Select
            label="Livro *"
            options={[
              { value: '', label: 'Selecione...' },
              ...books
                .filter((b) => b.availableQty > 0)
                .map((b) => ({ value: b.id, label: `${b.title} (${b.availableQty} disponível)` })),
            ]}
            value={loanForm.bookId}
            onChange={(e) => setLoanForm((f) => ({ ...f, bookId: e.target.value }))}
            required
          />
          <Input
            label="Nome do Leitor *"
            value={loanForm.borrowerName}
            onChange={(e) => setLoanForm((f) => ({ ...f, borrowerName: e.target.value }))}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Data do Empréstimo"
              type="date"
              value={loanForm.loanDate}
              onChange={(e) => setLoanForm((f) => ({ ...f, loanDate: e.target.value }))}
            />
            <Input
              label="Data Prevista Devolução *"
              type="date"
              value={loanForm.dueDate}
              onChange={(e) => setLoanForm((f) => ({ ...f, dueDate: e.target.value }))}
              required
            />
          </div>
          <Input
            label="Observações"
            value={loanForm.notes}
            onChange={(e) => setLoanForm((f) => ({ ...f, notes: e.target.value }))}
          />
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setIsLoanModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={creatingLoan}>
              Registrar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Return Confirmation Modal */}
      <Modal
        isOpen={!!returningLoan}
        onClose={() => setReturningLoan(null)}
        title="Confirmar Devolução"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Livro: <strong className="text-foreground">{returningLoan?.book.title}</strong>
          </p>
          <p className="text-xs text-muted-foreground">
            Vencimento: <strong className="text-foreground">{returningLoan?.dueDate}</strong> —
            multa de R$ 1,00/dia de atraso.
          </p>
          <Input
            label="Data da Devolução *"
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setReturningLoan(null)}>
              Cancelar
            </Button>
            <Button onClick={handleReturnBook} isLoading={processingReturn}>
              Confirmar Devolução
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reservation Modal */}
      <Modal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        title="Nova Reserva"
        size="sm"
      >
        <form onSubmit={handleCreateReservation} className="space-y-4">
          <Select
            label="Livro *"
            options={[
              { value: '', label: 'Selecione...' },
              ...books.map((b) => ({ value: b.id, label: b.title })),
            ]}
            value={resForm.bookId}
            onChange={(e) => setResForm((f) => ({ ...f, bookId: e.target.value }))}
            required
          />
          <Input
            label="Nome do Solicitante *"
            value={resForm.requesterName}
            onChange={(e) => setResForm((f) => ({ ...f, requesterName: e.target.value }))}
            required
          />
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReservationModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" isLoading={savingReservation}>
              Criar Reserva
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default LibraryPage;
