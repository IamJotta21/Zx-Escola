import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Edit3,
  CheckCircle2,
  XCircle,
  Eye,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Palette,
  BookOpen,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
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

export interface TenantItem {
  id: string;
  name: string;
  tradeName?: string | null;
  cnpj?: string | null;
  stateRegistration?: string | null;
  cityRegistration?: string | null;

  // Address
  cep?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;

  // Contact
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website?: string | null;

  // Legal
  legalName?: string | null;
  legalCpf?: string | null;
  legalRole?: string | null;
  legalEmail?: string | null;
  legalPhone?: string | null;

  // Branding
  logoUrl?: string | null;
  faviconUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;

  // Academic Config
  academicYear?: string | null;
  gradingSystem?: string | null;
  minPassingGrade?: number | null;
  minAttendance?: number | null;
  periodType?: string | null;

  // Financial Config
  currency?: string | null;
  defaultDueDay?: number | null;
  defaultInterest?: number | null;
  defaultFine?: number | null;

  status: string; // ACTIVE, SUSPENDED, CANCELLED
  plan: string; // BASIC, PRO, ENTERPRISE
  createdAt: string;

  _count?: {
    users: number;
    students: number;
    teachers: number;
    classes: number;
  };
}

export const SchoolsPage: React.FC = () => {
  const { addToast } = useToast();
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlan, setFilterPlan] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<TenantItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalTab, setModalTab] = useState<'general' | 'contact' | 'branding' | 'academic' | 'financial'>('general');

  // Form State
  const [formName, setFormName] = useState('');
  const [formTradeName, setFormTradeName] = useState('');
  const [formCnpj, setFormCnpj] = useState('');
  const [formStateReg, setFormStateReg] = useState('');
  const [formCityReg, setFormCityReg] = useState('');

  const [formCep, setFormCep] = useState('');
  const [formStreet, setFormStreet] = useState('');
  const [formNumber, setFormNumber] = useState('');
  const [formComplement, setFormComplement] = useState('');
  const [formNeighborhood, setFormNeighborhood] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');

  const [formPhone, setFormPhone] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formWebsite, setFormWebsite] = useState('');

  const [formLegalName, setFormLegalName] = useState('');
  const [formLegalCpf, setFormLegalCpf] = useState('');
  const [formLegalRole, setFormLegalRole] = useState('');
  const [formLegalEmail, setFormLegalEmail] = useState('');
  const [formLegalPhone, setFormLegalPhone] = useState('');

  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [formFaviconUrl, setFormFaviconUrl] = useState('');
  const [formPrimaryColor, setFormPrimaryColor] = useState('#3b82f6');
  const [formSecondaryColor, setFormSecondaryColor] = useState('#1e293b');

  const [formAcademicYear, setFormAcademicYear] = useState('2026');
  const [formGradingSystem, setFormGradingSystem] = useState('DECIMAL_0_10');
  const [formMinPassingGrade, setFormMinPassingGrade] = useState('6.0');
  const [formMinAttendance, setFormMinAttendance] = useState('75.0');
  const [formPeriodType, setFormPeriodType] = useState('BIMESTRE');

  const [formCurrency, setFormCurrency] = useState('BRL');
  const [formDefaultDueDay, setFormDefaultDueDay] = useState('10');
  const [formDefaultInterest, setFormDefaultInterest] = useState('1.0');
  const [formDefaultFine, setFormDefaultFine] = useState('2.0');

  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formPlan, setFormPlan] = useState('BASIC');

  // Details View Drawer
  const [viewingTenant, setViewingTenant] = useState<TenantItem | null>(null);

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (filterStatus) params.status = filterStatus;
      if (filterPlan) params.plan = filterPlan;
      if (searchTerm) params.search = searchTerm;

      const res = await api.get('/tenants', { params });
      setTenants(res.data.data || []);
    } catch {
      addToast({ type: 'error', message: 'Erro ao carregar lista de escolas/tenants.' });
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterPlan, searchTerm, addToast]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleOpenCreate = () => {
    setEditingTenant(null);
    setFormName('');
    setFormTradeName('');
    setFormCnpj('');
    setFormStateReg('');
    setFormCityReg('');

    setFormCep('');
    setFormStreet('');
    setFormNumber('');
    setFormComplement('');
    setFormNeighborhood('');
    setFormCity('');
    setFormState('');

    setFormPhone('');
    setFormWhatsapp('');
    setFormEmail('');
    setFormWebsite('');

    setFormLegalName('');
    setFormLegalCpf('');
    setFormLegalRole('');
    setFormLegalEmail('');
    setFormLegalPhone('');

    setFormLogoUrl('');
    setFormFaviconUrl('');
    setFormPrimaryColor('#3b82f6');
    setFormSecondaryColor('#1e293b');

    setFormAcademicYear('2026');
    setFormGradingSystem('DECIMAL_0_10');
    setFormMinPassingGrade('6.0');
    setFormMinAttendance('75.0');
    setFormPeriodType('BIMESTRE');

    setFormCurrency('BRL');
    setFormDefaultDueDay('10');
    setFormDefaultInterest('1.0');
    setFormDefaultFine('2.0');

    setFormStatus('ACTIVE');
    setFormPlan('BASIC');

    setModalTab('general');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tenant: TenantItem) => {
    setEditingTenant(tenant);
    setFormName(tenant.name);
    setFormTradeName(tenant.tradeName || '');
    setFormCnpj(tenant.cnpj || '');
    setFormStateReg(tenant.stateRegistration || '');
    setFormCityReg(tenant.cityRegistration || '');

    setFormCep(tenant.cep || '');
    setFormStreet(tenant.street || '');
    setFormNumber(tenant.number || '');
    setFormComplement(tenant.complement || '');
    setFormNeighborhood(tenant.neighborhood || '');
    setFormCity(tenant.city || '');
    setFormState(tenant.state || '');

    setFormPhone(tenant.phone || '');
    setFormWhatsapp(tenant.whatsapp || '');
    setFormEmail(tenant.email || '');
    setFormWebsite(tenant.website || '');

    setFormLegalName(tenant.legalName || '');
    setFormLegalCpf(tenant.legalCpf || '');
    setFormLegalRole(tenant.legalRole || '');
    setFormLegalEmail(tenant.legalEmail || '');
    setFormLegalPhone(tenant.legalPhone || '');

    setFormLogoUrl(tenant.logoUrl || '');
    setFormFaviconUrl(tenant.faviconUrl || '');
    setFormPrimaryColor(tenant.primaryColor || '#3b82f6');
    setFormSecondaryColor(tenant.secondaryColor || '#1e293b');

    setFormAcademicYear(tenant.academicYear || '2026');
    setFormGradingSystem(tenant.gradingSystem || 'DECIMAL_0_10');
    setFormMinPassingGrade(tenant.minPassingGrade?.toString() || '6.0');
    setFormMinAttendance(tenant.minAttendance?.toString() || '75.0');
    setFormPeriodType(tenant.periodType || 'BIMESTRE');

    setFormCurrency(tenant.currency || 'BRL');
    setFormDefaultDueDay(tenant.defaultDueDay?.toString() || '10');
    setFormDefaultInterest(tenant.defaultInterest?.toString() || '1.0');
    setFormDefaultFine(tenant.defaultFine?.toString() || '2.0');

    setFormStatus(tenant.status);
    setFormPlan(tenant.plan);

    setModalTab('general');
    setIsModalOpen(true);
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      addToast({ type: 'warning', message: 'O nome da escola é obrigatório.' });
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formName,
        tradeName: formTradeName || null,
        cnpj: formCnpj || null,
        stateRegistration: formStateReg || null,
        cityRegistration: formCityReg || null,
        cep: formCep || null,
        street: formStreet || null,
        number: formNumber || null,
        complement: formComplement || null,
        neighborhood: formNeighborhood || null,
        city: formCity || null,
        state: formState || null,
        phone: formPhone || null,
        whatsapp: formWhatsapp || null,
        email: formEmail || null,
        website: formWebsite || null,
        legalName: formLegalName || null,
        legalCpf: formLegalCpf || null,
        legalRole: formLegalRole || null,
        legalEmail: formLegalEmail || null,
        legalPhone: formLegalPhone || null,
        logoUrl: formLogoUrl || null,
        faviconUrl: formFaviconUrl || null,
        primaryColor: formPrimaryColor,
        secondaryColor: formSecondaryColor,
        academicYear: formAcademicYear,
        gradingSystem: formGradingSystem,
        minPassingGrade: parseFloat(formMinPassingGrade),
        minAttendance: parseFloat(formMinAttendance),
        periodType: formPeriodType,
        currency: formCurrency,
        defaultDueDay: parseInt(formDefaultDueDay),
        defaultInterest: parseFloat(formDefaultInterest),
        defaultFine: parseFloat(formDefaultFine),
        status: formStatus,
        plan: formPlan,
      };

      if (editingTenant) {
        await api.put(`/tenants/${editingTenant.id}`, payload);
        addToast({ type: 'success', message: 'Escola atualizada com sucesso!' });
      } else {
        await api.post('/tenants', payload);
        addToast({ type: 'success', message: 'Escola cadastrada no SaaS!' });
      }

      setIsModalOpen(false);
      fetchTenants();
    } catch {
      addToast({ type: 'error', message: 'Erro ao salvar dados da escola.' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (tenant: TenantItem) => {
    const newStatus = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await api.put(`/tenants/${tenant.id}`, { status: newStatus });
      addToast({
        type: 'success',
        message: `Escola ${tenant.name} foi ${newStatus === 'ACTIVE' ? 'ativada' : 'desativada'}.`,
      });
      fetchTenants();
    } catch {
      addToast({ type: 'error', message: 'Erro ao alterar status da escola.' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900 text-white rounded-2xl shadow-lg relative overflow-hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary tracking-widest uppercase bg-primary/20 px-2.5 py-1 rounded-md border border-primary/30">
              Módulo Multi-Tenant SaaS
            </span>
            <Badge variant="outline" className="border-slate-700 text-slate-300">
              {tenants.length} Escola(s) Cadastrada(s)
            </Badge>
          </div>
          <h1 className="text-2xl font-black">Gerenciamento de Escolas &amp; Tenants</h1>
          <p className="text-sm text-slate-300">
            Cadastre instituições de ensino, configure marcas visuais, parâmetros acadêmicos e regras financeiras.
          </p>
        </div>

        <Button
          variant="default"
          size="md"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={handleOpenCreate}
          className="shadow-md font-bold"
        >
          Nova Escola
        </Button>
      </div>

      {/* Control Bar: Search & Filters */}
      <Card className="stripe-card">
        <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full md:w-80">
            <Input
              placeholder="Buscar por escola, CNPJ ou cidade..."
              leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-40">
              <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">Todas as Situações</option>
                <option value="ACTIVE">Ativas</option>
                <option value="SUSPENDED">Suspensas / Inativas</option>
              </Select>
            </div>

            <div className="w-40">
              <Select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)}>
                <option value="">Todos os Planos</option>
                <option value="BASIC">Plano Basic</option>
                <option value="PRO">Plano Pro</option>
                <option value="ENTERPRISE">Plano Enterprise</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card className="stripe-card">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-foreground">
            Lista de Escolas Registradas no Sistema ({tenants.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Escola / Razão Social</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Cidade / UF</TableHead>
                <TableHead className="text-center">Alunos / Usuários</TableHead>
                <TableHead className="text-center">Plano</TableHead>
                <TableHead className="text-center">Situação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">
                    Nenhuma escola encontrada para os critérios informados.
                  </TableCell>
                </TableRow>
              ) : (
                tenants.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-bold text-xs text-foreground">{item.name}</div>
                      {item.tradeName && (
                        <div className="text-[10px] text-muted-foreground">{item.tradeName}</div>
                      )}
                    </TableCell>

                    <TableCell className="font-mono text-xs">
                      {item.cnpj || 'Não informado'}
                    </TableCell>

                    <TableCell className="text-xs">
                      {item.city ? `${item.city} / ${item.state || ''}` : 'Não informado'}
                    </TableCell>

                    <TableCell className="text-center font-mono text-xs">
                      <span className="text-primary font-bold">{item._count?.students || 0} alunos</span> •{' '}
                      {item._count?.users || 0} us.
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {item.plan}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge variant={item.status === 'ACTIVE' ? 'success' : 'destructive'}>
                        {item.status === 'ACTIVE' ? 'Ativa' : 'Suspensa'}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right space-x-1 whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewingTenant(item)}
                        title="Ver detalhes"
                      >
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(item)}
                        title="Editar escola"
                      >
                        <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={item.status === 'ACTIVE' ? 'text-rose-500' : 'text-emerald-500'}
                        onClick={() => handleToggleStatus(item)}
                        title={item.status === 'ACTIVE' ? 'Suspender escola' : 'Ativar escola'}
                      >
                        {item.status === 'ACTIVE' ? (
                          <XCircle className="h-3.5 w-3.5" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* CREATE / EDIT TENANT MODAL (WITH 5 CONFIG TABS) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTenant ? `Editar Escola: ${editingTenant.name}` : 'Cadastrar Nova Escola no SaaS'}
      >
        {/* Modal Tab Navigation */}
        <div className="flex border-b border-border overflow-x-auto pb-px mb-4 gap-1">
          {[
            { key: 'general', label: '1. Geral & Endereço', icon: <Building2 className="h-3.5 w-3.5" /> },
            { key: 'contact', label: '2. Contato & Legal', icon: <UserCheck className="h-3.5 w-3.5" /> },
            { key: 'branding', label: '3. Identidade Visual', icon: <Palette className="h-3.5 w-3.5" /> },
            { key: 'academic', label: '4. Acadêmico', icon: <BookOpen className="h-3.5 w-3.5" /> },
            { key: 'financial', label: '5. Financeiro', icon: <DollarSign className="h-3.5 w-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setModalTab(tab.key as any)}
              className={`flex items-center gap-1 px-3 py-2 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
                modalTab === tab.key
                  ? 'border-primary text-primary font-black'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSaveTenant} className="space-y-4">
          {/* TAB 1: DADOS GERAIS & ENDEREÇO */}
          {modalTab === 'general' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Nome Razão Social *</label>
                  <Input
                    placeholder="Ex: Colégio Dom Pedro II LTDA"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Nome Fantasia</label>
                  <Input
                    placeholder="Ex: Colégio Dom Pedro II"
                    value={formTradeName}
                    onChange={(e) => setFormTradeName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">CNPJ</label>
                  <Input
                    placeholder="00.000.000/0001-00"
                    value={formCnpj}
                    onChange={(e) => setFormCnpj(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Inscrição Estadual</label>
                  <Input
                    placeholder="Isento ou Nº"
                    value={formStateReg}
                    onChange={(e) => setFormStateReg(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Inscrição Municipal</label>
                  <Input
                    placeholder="Nº Inscrição"
                    value={formCityReg}
                    onChange={(e) => setFormCityReg(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <span className="text-xs font-bold text-muted-foreground uppercase block mb-2">Endereço Institucional</span>
                <div className="grid sm:grid-cols-3 gap-4 mb-3">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">CEP</label>
                    <Input
                      placeholder="00000-000"
                      value={formCep}
                      onChange={(e) => setFormCep(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-foreground block mb-1">Rua / Logradouro</label>
                    <Input
                      placeholder="Av. Principal"
                      value={formStreet}
                      onChange={(e) => setFormStreet(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Número</label>
                    <Input value={formNumber} onChange={(e) => setFormNumber(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Bairro</label>
                    <Input value={formNeighborhood} onChange={(e) => setFormNeighborhood(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Cidade</label>
                    <Input value={formCity} onChange={(e) => setFormCity(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Estado (UF)</label>
                    <Input placeholder="SP" value={formState} onChange={(e) => setFormState(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTATO & RESPONSÁVEL LEGAL */}
          {modalTab === 'contact' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <span className="text-xs font-bold text-muted-foreground uppercase block">Canais de Contato</span>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Telefone Principal</label>
                  <Input placeholder="(11) 3333-4444" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">WhatsApp Institucional</label>
                  <Input placeholder="(11) 99999-8888" value={formWhatsapp} onChange={(e) => setFormWhatsapp(e.target.value)} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">E-mail Oficial</label>
                  <Input type="email" placeholder="contato@escola.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground block mb-1">Website</label>
                  <Input placeholder="https://www.escola.com.br" value={formWebsite} onChange={(e) => setFormWebsite(e.target.value)} />
                </div>
              </div>

              <div className="pt-2 border-t border-border space-y-3">
                <span className="text-xs font-bold text-muted-foreground uppercase block">Responsável Legal da Instituição</span>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Nome do Responsável</label>
                    <Input value={formLegalName} onChange={(e) => setFormLegalName(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">CPF</label>
                    <Input placeholder="000.000.000-00" value={formLegalCpf} onChange={(e) => setFormLegalCpf(e.target.value)} />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Cargo</label>
                    <Input placeholder="Diretor / Mantenedor" value={formLegalRole} onChange={(e) => setFormLegalRole(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">E-mail Direto</label>
                    <Input type="email" value={formLegalEmail} onChange={(e) => setFormLegalEmail(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-foreground block mb-1">Telefone Direto</label>
                    <Input value={formLegalPhone} onChange={(e) => setFormLegalPhone(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: IDENTIDADE VISUAL */}
          {modalTab === 'branding' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">URL do Logotipo da Escola</label>
                <Input placeholder="https://..." value={formLogoUrl} onChange={(e) => setFormLogoUrl(e.target.value)} />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">URL do Ícone (Favicon)</label>
                <Input placeholder="https://..." value={formFaviconUrl} onChange={(e) => setFormFaviconUrl(e.target.value)} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Cor Principal (Primary Hex)</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formPrimaryColor}
                      onChange={(e) => setFormPrimaryColor(e.target.value)}
                      className="h-9 w-12 rounded border border-input cursor-pointer"
                    />
                    <Input value={formPrimaryColor} onChange={(e) => setFormPrimaryColor(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Cor Secundária (Secondary Hex)</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formSecondaryColor}
                      onChange={(e) => setFormSecondaryColor(e.target.value)}
                      className="h-9 w-12 rounded border border-input cursor-pointer"
                    />
                    <Input value={formSecondaryColor} onChange={(e) => setFormSecondaryColor(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONFIGURAÇÕES ACADÊMICAS */}
          {modalTab === 'academic' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Ano Letivo Vigente</label>
                  <Input value={formAcademicYear} onChange={(e) => setFormAcademicYear(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Divisão de Períodos</label>
                  <Select value={formPeriodType} onChange={(e) => setFormPeriodType(e.target.value)}>
                    <option value="BIMESTRE">4 Bimestres</option>
                    <option value="TRIMESTRE">3 Trimestres</option>
                    <option value="SEMESTRE">2 Semestres</option>
                  </Select>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Sistema de Notas</label>
                  <Select value={formGradingSystem} onChange={(e) => setFormGradingSystem(e.target.value)}>
                    <option value="DECIMAL_0_10">Nota Decimal (0.0 a 10.0)</option>
                    <option value="DECIMAL_0_100">Nota Inteira (0 a 100)</option>
                    <option value="CONCEITO">Conceito (A, B, C, D, E)</option>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Nota Mínima Aprovação</label>
                  <Input type="number" step="0.5" value={formMinPassingGrade} onChange={(e) => setFormMinPassingGrade(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Frequência Mínima (%)</label>
                  <Input type="number" step="1" value={formMinAttendance} onChange={(e) => setFormMinAttendance(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CONFIGURAÇÕES FINANCEIRAS */}
          {modalTab === 'financial' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Plano da Escola no SaaS *</label>
                  <Select value={formPlan} onChange={(e) => setFormPlan(e.target.value)}>
                    <option value="BASIC">Plano Basic</option>
                    <option value="PRO">Plano Pro</option>
                    <option value="ENTERPRISE">Plano Enterprise</option>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Situação no Sistema *</label>
                  <Select value={formStatus} onChange={(e) => setFormStatus(e.target.value)}>
                    <option value="ACTIVE">Ativa / Operacional</option>
                    <option value="SUSPENDED">Suspensa / Inadimplente</option>
                  </Select>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Dia Padrão Vencimento</label>
                  <Input type="number" min="1" max="31" value={formDefaultDueDay} onChange={(e) => setFormDefaultDueDay(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Juros Padrão (% / mês)</label>
                  <Input type="number" step="0.1" value={formDefaultInterest} onChange={(e) => setFormDefaultInterest(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">Multa Padrão por Atraso (%)</label>
                  <Input type="number" step="0.1" value={formDefaultFine} onChange={(e) => setFormDefaultFine(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-border">
            <div className="flex gap-1 text-[10px] text-muted-foreground font-mono">
              Navegue pelas 5 abas para configurar.
            </div>
            <div className="flex gap-3">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button variant="default" size="sm" type="submit" disabled={saving}>
                {saving ? 'Salvando...' : editingTenant ? 'Atualizar Escola' : 'Cadastrar Escola'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SchoolsPage;
